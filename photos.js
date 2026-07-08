/**
 * Curated Unsplash photos — verified URLs for Colima / Manzanillo trip site.
 * All images are free to use under the Unsplash License.
 */
(function (global) {
  'use strict';

  var PHOTOS = {
    /* Hero & mood board */
    heroColonial: '1585464231875-d9ef1f5ad396',
    heroBeach: '1505118380757-91f5f5632de0',
    heroVillage: '1741293087713-ed0fddc2c875',

    /* Colima destinations */
    comala: '1516537219851-920e2670c6e3',
    nogueras: '1520250497591-112f2f40a3f4',
    colimaCity: '1585464231875-d9ef1f5ad396',
    lagunaMaria: '1441974231531-c6227db76b6e',
    suchitlan: '1470071459604-3b5ec3a7fe05',
    cuyutlan: '1741293087713-ed0fddc2c875',
    river: '1501785888041-af3ef285b470',
    ruins: '1518638150340-f706e86654de',
    food: '1555939594-58d7cb561ad1',
    market: '1552733407-5d5c46c3bb3b',

    /* Manzanillo */
    manzanilloBeach: '1505118380757-91f5f5632de0',
    manzanilloSunset: '1506905925346-21bda4d32df4',
    seafood: '1559339352-11d035aa65de',
    fishing: '1544551763-46a013bb70d5',
    kayak: '1530549387789-4c1017266635',
    viewpoint: '1682687220063-4742bd7fd538',
    hiking: '1470071459604-3b5ec3a7fe05',
    malecon: '1516450360452-9312f5e86fc7',
    lasHadas: '1571003123894-1f0594d2b5d9',

    /* Shared */
    forest: '1441974231531-c6227db76b6e',
    sunset: '1506905925346-21bda4d32df4',
    tacos: '1565299585323-38d6b0865b47'
  };

  var CREDIT = 'Photos via Unsplash';

  function photoUrl(id, width) {
    return 'https://images.unsplash.com/photo-' + id +
      '?auto=format&fit=crop&w=' + (width || 800) + '&q=80';
  }

  function applyPhotos() {
    document.querySelectorAll('[data-photo]').forEach(function (img) {
      var key = img.getAttribute('data-photo');
      var width = img.getAttribute('data-photo-w') || 800;
      if (PHOTOS[key]) {
        img.src = photoUrl(PHOTOS[key], width);
        img.removeAttribute('data-photo');
      }
    });
  }

  global.TripPhotos = {
    PHOTOS: PHOTOS,
    photoUrl: photoUrl,
    applyPhotos: applyPhotos,
    CREDIT: CREDIT
  };
})(window);
