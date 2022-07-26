/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/

(function ($, Drupal, drupalSettings, storage) {
  const currentUserID = parseInt(drupalSettings.user.uid, 10);
  const secondsIn30Days = 2592000;
  const thirtyDaysAgo = Math.round(new Date().getTime() / 1000) - secondsIn30Days;
  let embeddedLastReadTimestamps = false;

  if (drupalSettings.history && drupalSettings.history.lastReadTimestamps) {
    embeddedLastReadTimestamps = drupalSettings.history.lastReadTimestamps;
  }

  Drupal.history = {
    fetchTimestamps(nodeIDs, callback) {
      if (embeddedLastReadTimestamps) {
        callback();
        return;
      }

      $.ajax({
        url: Drupal.url('history/get_node_read_timestamps'),
        type: 'POST',
        data: {
          'node_ids[]': nodeIDs
        },
        dataType: 'json',

        success(results) {
          Object.keys(results || {}).forEach(nodeID => {
            storage.setItem(`Drupal.history.${currentUserID}.${nodeID}`, results[nodeID]);
          });
          callback();
        }

      });
    },

    getLastRead(nodeID) {
      if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
        return parseInt(embeddedLastReadTimestamps[nodeID], 10);
      }

      return parseInt(storage.getItem(`Drupal.history.${currentUserID}.${nodeID}`) || 0, 10);
    },

    markAsRead(nodeID) {
      $.ajax({
        url: Drupal.url(`history/${nodeID}/read`),
        type: 'POST',
        dataType: 'json',

        success(timestamp) {
          if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
            return;
          }

          storage.setItem(`Drupal.history.${currentUserID}.${nodeID}`, timestamp);
        }

      });
    },

    needsServerCheck(nodeID, contentTimestamp) {
      if (contentTimestamp < thirtyDaysAgo) {
        return false;
      }

      if (embeddedLastReadTimestamps && embeddedLastReadTimestamps[nodeID]) {
        return contentTimestamp > parseInt(embeddedLastReadTimestamps[nodeID], 10);
      }

      const minLastReadTimestamp = parseInt(storage.getItem(`Drupal.history.${currentUserID}.${nodeID}`) || 0, 10);
      return contentTimestamp > minLastReadTimestamp;
    }

  };
})(jQuery, Drupal, drupalSettings, window.localStorage);