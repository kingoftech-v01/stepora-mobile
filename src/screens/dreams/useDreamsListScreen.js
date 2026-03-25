/**
 * useDreamsListScreen — Business logic for the Dreams list screen.
 * All data fetching, filtering, and state live here.
 */
var { useState } = require('react');
var { useNavigation } = require('@react-navigation/native');
var useInfiniteList = require('../../hooks/useInfiniteList');
var { DREAMS } = require('../../services/endpoints');
var { CATEGORIES, catSolid, BRAND, GRADIENTS } = require('../../styles/colors');

var CAT_ICONS = {
  career: 'briefcase',
  hobbies: 'edit-3',
  health: 'heart',
  finance: 'dollar-sign',
  personal: 'cpu',
  relationships: 'users',
};

var STATUS_CFG = {
  active: { icon: 'target', color: '#5DE5A8' },
  completed: { icon: 'check-circle', color: '#8B5CF6' },
  paused: { icon: 'pause-circle', color: '#FCD34D' },
  archived: { icon: 'archive', color: '#9CA3AF' },
};

var useDreamsListScreen = function () {
  var navigation = useNavigation();
  var [activeFilter, setActiveFilter] = useState('all');
  var [searchQuery, setSearchQuery] = useState('');

  var dreamsInf = useInfiniteList({ queryKey: ['dreams'], url: DREAMS.LIST, limit: 50 });
  var dreams = dreamsInf.items;

  var filtered = dreams;
  if (activeFilter !== 'all') {
    filtered = filtered.filter(function (d) {
      return d.status === activeFilter;
    });
  }
  if (searchQuery.trim()) {
    var q = searchQuery.toLowerCase();
    filtered = filtered.filter(function (d) {
      return (
        (d.title && d.title.toLowerCase().indexOf(q) !== -1) ||
        (d.category && d.category.toLowerCase().indexOf(q) !== -1)
      );
    });
  }

  var filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'paused', label: 'Paused' },
  ];

  return {
    navigation: navigation,
    activeFilter: activeFilter,
    setActiveFilter: setActiveFilter,
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    dreamsInf: dreamsInf,
    dreams: dreams,
    filtered: filtered,
    filters: filters,
    CAT_ICONS: CAT_ICONS,
    STATUS_CFG: STATUS_CFG,
    CATEGORIES: CATEGORIES,
    catSolid: catSolid,
    BRAND: BRAND,
  };
};

module.exports = useDreamsListScreen;
