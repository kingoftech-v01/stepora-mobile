/**
 * useVisionBoardScreen — Business logic for the visual goal board.
 * Fetches user's dreams and their vision board images.
 */
var { useState, useCallback } = require('react');
var { Alert } = require('react-native');
var { useNavigation } = require('@react-navigation/native');
var { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
var { apiGet, apiPost, apiDelete, apiUpload } = require('../../services/api');
var { DREAMS } = require('../../services/endpoints');
var { catSolid } = require('../../styles/colors');

var useVisionBoardScreen = function () {
  var navigation = useNavigation();
  var queryClient = useQueryClient();
  var [selectedDreamId, setSelectedDreamId] = useState('all');
  var [addingImage, setAddingImage] = useState(false);

  // Fetch dreams list (for selector + images)
  var dreamsQuery = useQuery({
    queryKey: ['dreams-vision'],
    queryFn: function () {
      return apiGet(DREAMS.LIST + '?page_size=100');
    },
  });

  var rawDreams = dreamsQuery.data;
  var dreams = Array.isArray(rawDreams)
    ? rawDreams
    : rawDreams && rawDreams.results
      ? rawDreams.results
      : [];

  // Fetch vision board for selected dream
  var visionQuery = useQuery({
    queryKey: ['vision-board', selectedDreamId],
    queryFn: function () {
      if (selectedDreamId === 'all') {
        // Fetch all dreams' vision boards
        return Promise.all(
          dreams.map(function (d) {
            return apiGet(DREAMS.VISION_BOARD(d.id))
              .then(function (data) {
                var images = Array.isArray(data) ? data : data && data.results ? data.results : [];
                return images.map(function (img) {
                  return Object.assign({}, img, { dreamId: d.id, dreamTitle: d.title, dreamCategory: d.category });
                });
              })
              .catch(function () { return []; });
          })
        ).then(function (arrays) {
          var flat = [];
          arrays.forEach(function (arr) { flat = flat.concat(arr); });
          return flat;
        });
      }
      return apiGet(DREAMS.VISION_BOARD(selectedDreamId)).then(function (data) {
        var images = Array.isArray(data) ? data : data && data.results ? data.results : [];
        var dream = dreams.find(function (d) { return d.id === selectedDreamId; });
        return images.map(function (img) {
          return Object.assign({}, img, {
            dreamId: selectedDreamId,
            dreamTitle: dream ? dream.title : '',
            dreamCategory: dream ? dream.category : '',
          });
        });
      });
    },
    enabled: dreams.length > 0,
  });

  var visionImages = visionQuery.data || [];

  // Add image mutation
  var addImageMut = useMutation({
    mutationFn: function (params) {
      var dreamId = params.dreamId;
      var uri = params.uri;
      var formData = new FormData();
      formData.append('image', {
        uri: uri,
        name: 'vision-' + Date.now() + '.jpg',
        type: 'image/jpeg',
      });
      if (params.caption) {
        formData.append('caption', params.caption);
      }
      return apiUpload(DREAMS.VISION_BOARD_ADD(dreamId), formData);
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['vision-board'] });
      setAddingImage(false);
    },
    onError: function (err) {
      Alert.alert('Upload Failed', err.userMessage || err.message || 'Failed to add image.');
    },
  });

  // Delete image mutation
  var deleteImageMut = useMutation({
    mutationFn: function (params) {
      return apiDelete(DREAMS.VISION_BOARD_DELETE(params.dreamId, params.imageId));
    },
    onSuccess: function () {
      queryClient.invalidateQueries({ queryKey: ['vision-board'] });
    },
  });

  // Image picker handler
  var handleAddImage = useCallback(function (dreamId) {
    try {
      var ImagePicker = require('react-native-image-picker');
      ImagePicker.launchImageLibrary(
        {
          mediaType: 'photo',
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        },
        function (response) {
          if (response.didCancel || response.errorCode) return;
          var asset = response.assets && response.assets[0];
          if (asset && asset.uri) {
            var targetDream = dreamId || selectedDreamId;
            if (targetDream === 'all') {
              // If "all" selected, let user pick a dream
              if (dreams.length === 1) {
                targetDream = dreams[0].id;
              } else {
                setAddingImage(true);
                // Store the URI temporarily
                handleAddImage._pendingUri = asset.uri;
                return;
              }
            }
            addImageMut.mutate({ dreamId: targetDream, uri: asset.uri });
          }
        }
      );
    } catch (e) {
      Alert.alert('Not Available', 'Image picker is not configured yet.');
    }
  }, [selectedDreamId, dreams]);

  var handleTakePhoto = useCallback(function (dreamId) {
    try {
      var ImagePicker = require('react-native-image-picker');
      ImagePicker.launchCamera(
        {
          mediaType: 'photo',
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        },
        function (response) {
          if (response.didCancel || response.errorCode) return;
          var asset = response.assets && response.assets[0];
          if (asset && asset.uri) {
            var targetDream = dreamId || selectedDreamId;
            if (targetDream === 'all' && dreams.length >= 1) {
              targetDream = dreams[0].id;
            }
            addImageMut.mutate({ dreamId: targetDream, uri: asset.uri });
          }
        }
      );
    } catch (e) {
      Alert.alert('Not Available', 'Camera is not configured yet.');
    }
  }, [selectedDreamId, dreams]);

  var handleDeleteImage = useCallback(function (dreamId, imageId) {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image from your vision board?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: function () {
            deleteImageMut.mutate({ dreamId: dreamId, imageId: imageId });
          },
        },
      ]
    );
  }, []);

  var confirmAddToDream = useCallback(function (dreamId) {
    var uri = handleAddImage._pendingUri;
    if (uri && dreamId) {
      addImageMut.mutate({ dreamId: dreamId, uri: uri });
      handleAddImage._pendingUri = null;
    }
    setAddingImage(false);
  }, []);

  return {
    navigation: navigation,
    dreams: dreams,
    selectedDreamId: selectedDreamId,
    setSelectedDreamId: setSelectedDreamId,
    visionImages: visionImages,
    dreamsQuery: dreamsQuery,
    visionQuery: visionQuery,
    addImageMut: addImageMut,
    deleteImageMut: deleteImageMut,
    addingImage: addingImage,
    setAddingImage: setAddingImage,
    handleAddImage: handleAddImage,
    handleTakePhoto: handleTakePhoto,
    handleDeleteImage: handleDeleteImage,
    confirmAddToDream: confirmAddToDream,
    catSolid: catSolid,
  };
};

module.exports = useVisionBoardScreen;
