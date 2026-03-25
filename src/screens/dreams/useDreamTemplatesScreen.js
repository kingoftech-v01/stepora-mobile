/**
 * useDreamTemplatesScreen — Business logic for browsing and using dream templates.
 */
var { useState, useCallback } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { CATEGORIES, catSolid } = require('../../styles/colors');

var CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'travel', label: 'Travel' },
  { key: 'career', label: 'Career' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'education', label: 'Education' },
  { key: 'finance', label: 'Finance' },
  { key: 'creative', label: 'Creative' },
];

var CAT_EMOJIS = {
  travel: '\u2708\uFE0F',
  career: '\uD83D\uDCBC',
  fitness: '\uD83C\uDFCB\uFE0F',
  education: '\uD83C\uDF93',
  finance: '\uD83D\uDCB0',
  creative: '\uD83C\uDFA8',
  health: '\uD83E\uDDCB',
  hobbies: '\uD83C\uDFB5',
  personal: '\uD83C\uDF31',
  relationships: '\u2764\uFE0F',
};

var useDreamTemplatesScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [activeCategory, setActiveCategory] = useState('all');
  var [selectedTemplate, setSelectedTemplate] = useState(null);
  var [searchQuery, setSearchQuery] = useState('');

  // Fetch templates
  var templatesQuery = useQuery({
    queryKey: ['dream-templates'],
    queryFn: function () {
      return apiGet(DREAMS.TEMPLATES.LIST);
    },
  });

  // Fetch featured templates
  var featuredQuery = useQuery({
    queryKey: ['dream-templates-featured'],
    queryFn: function () {
      return apiGet(DREAMS.TEMPLATES.FEATURED);
    },
  });

  var rawTemplates = templatesQuery.data;
  var templates = Array.isArray(rawTemplates)
    ? rawTemplates
    : rawTemplates && rawTemplates.results
      ? rawTemplates.results
      : [];

  var DIFFICULTY_CONFIG = {
    beginner: { label: 'Beginner', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
    intermediate: { label: 'Intermediate', color: '#FCD34D', bg: 'rgba(252,211,77,0.12)', border: 'rgba(252,211,77,0.25)' },
    advanced: { label: 'Advanced', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  };

  var rawFeatured = featuredQuery.data;
  var featured = Array.isArray(rawFeatured)
    ? rawFeatured
    : rawFeatured && rawFeatured.results
      ? rawFeatured.results
      : [];

  // Filter by category
  var filtered = templates;
  if (activeCategory !== 'all') {
    filtered = filtered.filter(function (t) {
      return t.category === activeCategory;
    });
  }
  if (searchQuery.trim()) {
    var q = searchQuery.toLowerCase();
    filtered = filtered.filter(function (t) {
      return (
        (t.title && t.title.toLowerCase().indexOf(q) !== -1) ||
        (t.description && t.description.toLowerCase().indexOf(q) !== -1) ||
        (t.category && t.category.toLowerCase().indexOf(q) !== -1)
      );
    });
  }

  // Use template mutation
  var useTemplateMut = useMutation({
    mutationFn: function (templateId) {
      return apiPost(DREAMS.TEMPLATES.USE(templateId));
    },
    onSuccess: function (data) {
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
      setSelectedTemplate(null);
      // Navigate to the newly created dream
      var dreamId = data && (data.id || data.dreamId);
      if (dreamId) {
        navigation.navigate('DreamDetail', { id: dreamId });
      } else {
        navigation.goBack();
      }
    },
  });

  var handleUseTemplate = useCallback(function (templateId) {
    useTemplateMut.mutate(templateId);
  }, []);

  var openPreview = useCallback(function (template) {
    setSelectedTemplate(template);
  }, []);

  var closePreview = useCallback(function () {
    setSelectedTemplate(null);
  }, []);

  return {
    navigation: navigation,
    activeCategory: activeCategory,
    setActiveCategory: setActiveCategory,
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    templatesQuery: templatesQuery,
    templates: filtered,
    featured: featured,
    selectedTemplate: selectedTemplate,
    openPreview: openPreview,
    closePreview: closePreview,
    handleUseTemplate: handleUseTemplate,
    useTemplateMut: useTemplateMut,
    CATEGORY_TABS: CATEGORY_TABS,
    CAT_EMOJIS: CAT_EMOJIS,
    catSolid: catSolid,
    CATEGORIES: CATEGORIES,
    DIFFICULTY_CONFIG: DIFFICULTY_CONFIG,
  };
};

module.exports = useDreamTemplatesScreen;
