/**
 * Real-time shared trip board via Firebase Firestore.
 * Falls back gracefully when sync is not configured.
 */
(function (global) {
  const config = global.TripSyncConfig;
  let db = null;
  let tripRef = null;
  let unsubscribe = null;
  let applyingRemote = false;
  let hooks = null;
  let status = 'offline';

  function setStatus(next, detail) {
    status = next;
    if (hooks && hooks.onStatusChange) hooks.onStatusChange(next, detail);
  }

  function isReady() {
    return Boolean(
      config &&
      config.enabled &&
      config.firebase &&
      config.firebase.apiKey &&
      config.firebase.apiKey !== 'YOUR_API_KEY' &&
      config.firebase.projectId &&
      config.firebase.projectId !== 'YOUR_PROJECT_ID'
    );
  }

  function serializeState(state) {
    return {
      tripName: state.tripName,
      month: state.month,
      travelers: state.travelers,
      members: state.members,
      budget: state.budget,
      contributions: state.contributions,
      updatedAt: Date.now()
    };
  }

  async function ensureDoc() {
    const snap = await tripRef.get();
    if (!snap.exists) {
      const starter = serializeState(hooks.getDefaultState());
      await tripRef.set(starter);
    }
  }

  function initFirebase() {
    if (!global.firebase || !global.firebase.apps) {
      throw new Error('Firebase SDK not loaded');
    }
    if (!global.firebase.apps.length) {
      global.firebase.initializeApp(config.firebase);
    }
    db = global.firebase.firestore();
    tripRef = db.collection('trips').doc(config.tripId || 'colima-family-2027');
  }

  async function pushState(state) {
    if (!tripRef || applyingRemote) return;
    try {
      await tripRef.set(serializeState(state), { merge: true });
      setStatus('live', 'Changes saved for the group');
    } catch (err) {
      console.warn('Could not sync trip data', err);
      setStatus('error', 'Could not save — check your connection');
    }
  }

  async function addContribution(contribution) {
    if (!tripRef) throw new Error('Sync not initialized');

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(tripRef);
      const data = snap.exists ? snap.data() : serializeState(hooks.getDefaultState());
      const contributions = Array.isArray(data.contributions) ? data.contributions : [];
      contributions.push(contribution);
      transaction.set(tripRef, {
        ...data,
        contributions,
        updatedAt: Date.now()
      }, { merge: true });
    });
  }

  function subscribe() {
    if (!tripRef) return;

    unsubscribe = tripRef.onSnapshot(
      (snap) => {
        if (!snap.exists) return;
        applyingRemote = true;
        hooks.setState(snap.data());
        applyingRemote = false;
        setStatus('live', 'Everyone sees the same numbers');
      },
      (err) => {
        console.warn('Live sync disconnected', err);
        setStatus('error', 'Live sync disconnected');
      }
    );
  }

  async function init(tripHooks) {
    hooks = tripHooks;

    if (!isReady()) {
      setStatus('offline', 'Group sync not set up yet — see setup guide');
      return false;
    }

    try {
      initFirebase();
      setStatus('connecting', 'Connecting to group board…');
      await ensureDoc();
      subscribe();
      setStatus('live', 'Live group board');
      return true;
    } catch (err) {
      console.warn('Could not start group sync', err);
      setStatus('error', 'Could not connect to group board');
      return false;
    }
  }

  function destroy() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    db = null;
    tripRef = null;
  }

  global.TripSync = {
    init,
    destroy,
    pushState,
    addContribution,
    isReady,
    isApplyingRemote: () => applyingRemote,
    getStatus: () => status
  };
})(window);
