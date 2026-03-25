/**
 * useSharedDreamsScreen — Business logic for the Shared Dreams screen.
 * Fetches dreams shared with the current user via infinite scroll.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var useInfiniteList = require('../../hooks/useInfiniteList');
var { DREAMS } = require('../../services/endpoints');
var { BRAND, adaptColor } = require('../../styles/colors');

var useSharedDreamsScreen = function () {
  var navigation = useNavigation();
  var [mounted, setMounted] = useState(false);

  useEffect(function () {
    var timer = setTimeout(function () {
      setMounted(true);
    }, 50);
    return function () { clearTimeout(timer); };
  }, []);

  var sharedInf = useInfiniteList({
    queryKey: ['shared-dreams'],
    url: DREAMS.SHARED_WITH_ME,
    limit: 20,
  });
  var dreams = sharedInf.items;

  return {
    navigation: navigation,
    mounted: mounted,
    sharedInf: sharedInf,
    dreams: dreams,
    BRAND: BRAND,
    adaptColor: adaptColor,
  };
};

module.exports = useSharedDreamsScreen;
