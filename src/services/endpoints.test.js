/**
 * Tests for src/services/endpoints.js
 * Validates all endpoint constants and dynamic endpoint functions.
 */

var {
  AUTH,
  USERS,
  DREAMS,
  CONVERSATIONS,
  AI_CHAT,
  FRIEND_CHAT,
  CALENDAR,
  NOTIFICATIONS,
  SUBSCRIPTIONS,
  STORE,
  LEAGUES,
  CIRCLES,
  SOCIAL,
  BUDDIES,
  SEARCH,
  APP_UPDATES,
  WS,
} = require('./endpoints');

// ─── Helper: recursively collect all values from nested endpoint objects ──
function collectEndpoints(obj, results) {
  if (!results) results = [];
  for (var key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    var val = obj[key];
    if (typeof val === 'string') {
      results.push({ key: key, value: val, type: 'string' });
    } else if (typeof val === 'function') {
      results.push({ key: key, value: val, type: 'function' });
    } else if (typeof val === 'object' && val !== null) {
      collectEndpoints(val, results);
    }
  }
  return results;
}

describe('endpoints.js', function () {
  describe('AUTH endpoints', function () {
    it('has all expected auth URLs as strings', function () {
      expect(typeof AUTH.LOGIN).toBe('string');
      expect(typeof AUTH.LOGOUT).toBe('string');
      expect(typeof AUTH.REGISTER).toBe('string');
      expect(typeof AUTH.TOKEN_REFRESH).toBe('string');
      expect(typeof AUTH.PASSWORD_CHANGE).toBe('string');
      expect(typeof AUTH.PASSWORD_RESET).toBe('string');
      expect(typeof AUTH.PASSWORD_RESET_CONFIRM).toBe('string');
      expect(typeof AUTH.PASSWORD_RESET_VALIDATE).toBe('string');
      expect(typeof AUTH.USER).toBe('string');
      expect(typeof AUTH.VERIFY_EMAIL).toBe('string');
      expect(typeof AUTH.RESEND_EMAIL).toBe('string');
      expect(typeof AUTH.TFA_CHALLENGE).toBe('string');
    });

    it('all string endpoints start with /api/', function () {
      var strings = collectEndpoints(AUTH).filter(function (e) {
        return e.type === 'string';
      });
      strings.forEach(function (entry) {
        expect(entry.value).toMatch(/^\/api\//);
      });
    });

    it('all string endpoints end with /', function () {
      var strings = collectEndpoints(AUTH).filter(function (e) {
        return e.type === 'string';
      });
      strings.forEach(function (entry) {
        expect(entry.value).toMatch(/\/$/);
      });
    });
  });

  describe('USERS endpoints', function () {
    it('has static endpoints as strings', function () {
      expect(typeof USERS.ME).toBe('string');
      expect(typeof USERS.UPDATE_PROFILE).toBe('string');
      expect(typeof USERS.GAMIFICATION).toBe('string');
      expect(typeof USERS.COMPLETE_ONBOARDING).toBe('string');
    });

    it('PROFILE function returns correct URL', function () {
      expect(USERS.PROFILE(42)).toBe('/api/users/42/');
      expect(USERS.PROFILE('abc')).toBe('/api/users/abc/');
    });

    it('TFA sub-endpoints are strings', function () {
      expect(typeof USERS.TFA.SETUP).toBe('string');
      expect(typeof USERS.TFA.VERIFY).toBe('string');
      expect(typeof USERS.TFA.DISABLE).toBe('string');
      expect(typeof USERS.TFA.STATUS).toBe('string');
      expect(typeof USERS.TFA.BACKUP_CODES).toBe('string');
    });
  });

  describe('DREAMS endpoints', function () {
    it('LIST is a static string', function () {
      expect(DREAMS.LIST).toBe('/api/dreams/dreams/');
    });

    it('DETAIL returns correct URL with ID', function () {
      expect(DREAMS.DETAIL(1)).toBe('/api/dreams/dreams/1/');
      expect(DREAMS.DETAIL('abc-123')).toBe('/api/dreams/dreams/abc-123/');
    });

    it('ANALYZE returns correct URL', function () {
      expect(DREAMS.ANALYZE(5)).toBe('/api/dreams/dreams/5/analyze/');
    });

    it('ANALYTICS handles range param', function () {
      expect(DREAMS.ANALYTICS(1, '30d')).toBe('/api/dreams/dreams/1/analytics/?range=30d');
      expect(DREAMS.ANALYTICS(1)).toBe('/api/dreams/dreams/1/analytics/');
    });

    it('VISION_BOARD_DELETE requires two params', function () {
      expect(DREAMS.VISION_BOARD_DELETE(1, 99)).toBe('/api/dreams/dreams/1/vision-board/99/');
    });

    it('TAG_DELETE encodes tag name', function () {
      expect(DREAMS.TAG_DELETE(1, 'my tag')).toBe(
        '/api/dreams/dreams/1/tags/my%20tag/',
      );
    });

    it('GOALS sub-endpoints exist', function () {
      expect(DREAMS.GOALS.LIST).toBe('/api/dreams/goals/');
      expect(DREAMS.GOALS.DETAIL(7)).toBe('/api/dreams/goals/7/');
      expect(DREAMS.GOALS.COMPLETE(7)).toBe('/api/dreams/goals/7/complete/');
    });

    it('TASKS sub-endpoints exist', function () {
      expect(DREAMS.TASKS.LIST).toBe('/api/dreams/tasks/');
      expect(DREAMS.TASKS.DETAIL(3)).toBe('/api/dreams/tasks/3/');
      expect(DREAMS.TASKS.COMPLETE(3)).toBe('/api/dreams/tasks/3/complete/');
      expect(DREAMS.TASKS.SKIP(3)).toBe('/api/dreams/tasks/3/skip/');
    });

    it('MILESTONES sub-endpoints exist', function () {
      expect(DREAMS.MILESTONES.LIST).toBe('/api/dreams/milestones/');
      expect(DREAMS.MILESTONES.DETAIL(2)).toBe('/api/dreams/milestones/2/');
    });

    it('CHECKINS sub-endpoints exist', function () {
      expect(DREAMS.CHECKINS.LIST).toBe('/api/dreams/checkins/');
      expect(DREAMS.CHECKINS.RESPOND(9)).toBe('/api/dreams/checkins/9/respond/');
    });

    it('PROGRESS_PHOTOS functions work correctly', function () {
      expect(DREAMS.PROGRESS_PHOTOS.LIST(5)).toBe('/api/dreams/dreams/5/progress-photos/');
      expect(DREAMS.PROGRESS_PHOTOS.UPLOAD(5)).toBe('/api/dreams/dreams/5/progress-photos/upload/');
      expect(DREAMS.PROGRESS_PHOTOS.ANALYZE(5, 10)).toBe(
        '/api/dreams/dreams/5/progress-photos/10/analyze/',
      );
    });
  });

  describe('AI_CHAT / CONVERSATIONS endpoints', function () {
    it('LIST is a static string', function () {
      expect(CONVERSATIONS.LIST).toBe('/api/ai/conversations/');
    });

    it('dynamic endpoints return correct URLs', function () {
      expect(CONVERSATIONS.DETAIL(1)).toBe('/api/ai/conversations/1/');
      expect(CONVERSATIONS.SEND_MESSAGE(1)).toBe('/api/ai/conversations/1/send_message/');
      expect(CONVERSATIONS.MESSAGES(1)).toBe('/api/ai/conversations/1/messages/');
      expect(CONVERSATIONS.MARK_READ(1)).toBe('/api/ai/conversations/1/mark-read/');
    });

    it('SEARCH_MESSAGES encodes query', function () {
      expect(CONVERSATIONS.SEARCH_MESSAGES(1, 'hello world')).toBe(
        '/api/ai/conversations/1/search/?q=hello%20world',
      );
    });

    it('BRANCHES functions work', function () {
      expect(CONVERSATIONS.BRANCHES.CREATE(1)).toBe('/api/ai/conversations/1/branch/');
      expect(CONVERSATIONS.BRANCHES.SEND(1, 2)).toBe('/api/ai/conversations/1/branch/2/send/');
    });
  });

  describe('FRIEND_CHAT endpoints', function () {
    it('LIST is a static string', function () {
      expect(FRIEND_CHAT.LIST).toBe('/api/chat/');
    });

    it('START is a static string', function () {
      expect(FRIEND_CHAT.START).toBe('/api/chat/start/');
    });

    it('dynamic endpoints return correct URLs', function () {
      expect(FRIEND_CHAT.DETAIL(1)).toBe('/api/chat/1/');
      expect(FRIEND_CHAT.SEND_MESSAGE(1)).toBe('/api/chat/1/send-message/');
      expect(FRIEND_CHAT.MESSAGES(1)).toBe('/api/chat/1/messages/');
      expect(FRIEND_CHAT.MARK_READ(1)).toBe('/api/chat/1/mark-read/');
    });

    it('CALLS sub-endpoints exist', function () {
      expect(FRIEND_CHAT.CALLS.INITIATE).toBe('/api/chat/calls/initiate/');
      expect(FRIEND_CHAT.CALLS.ACCEPT(5)).toBe('/api/chat/calls/5/accept/');
    });
  });

  describe('CALENDAR endpoints', function () {
    it('has static endpoints', function () {
      expect(typeof CALENDAR.EVENTS).toBe('string');
      expect(typeof CALENDAR.VIEW).toBe('string');
      expect(typeof CALENDAR.TODAY).toBe('string');
    });

    it('EVENT_DETAIL function works', function () {
      expect(CALENDAR.EVENT_DETAIL(1)).toBe('/api/calendar/events/1/');
    });

    it('GOOGLE sub-endpoints exist', function () {
      expect(typeof CALENDAR.GOOGLE.STATUS).toBe('string');
      expect(typeof CALENDAR.GOOGLE.AUTH).toBe('string');
      expect(typeof CALENDAR.GOOGLE.SYNC).toBe('string');
    });

    it('HABITS sub-endpoints work', function () {
      expect(CALENDAR.HABITS.LIST).toBe('/api/calendar/habits/');
      expect(CALENDAR.HABITS.COMPLETE(1)).toBe('/api/calendar/habits/1/complete/');
      expect(CALENDAR.HABITS.STATS(1)).toBe('/api/calendar/habits/1/stats/');
    });

    it('SHARING sub-endpoints work', function () {
      expect(CALENDAR.SHARING.SHARED('abc')).toBe('/api/calendar/shared/abc/');
      expect(CALENDAR.SHARING.SUGGEST('abc')).toBe('/api/calendar/shared/abc/suggest/');
    });
  });

  describe('NOTIFICATIONS endpoints', function () {
    it('LIST is a string', function () {
      expect(NOTIFICATIONS.LIST).toBe('/api/notifications/');
    });

    it('dynamic endpoints work', function () {
      expect(NOTIFICATIONS.DETAIL(1)).toBe('/api/notifications/1/');
      expect(NOTIFICATIONS.MARK_READ(1)).toBe('/api/notifications/1/mark_read/');
      expect(NOTIFICATIONS.OPENED(1)).toBe('/api/notifications/1/opened/');
    });
  });

  describe('SUBSCRIPTIONS endpoints', function () {
    it('has expected static endpoints', function () {
      expect(typeof SUBSCRIPTIONS.PLANS).toBe('string');
      expect(typeof SUBSCRIPTIONS.CURRENT).toBe('string');
      expect(typeof SUBSCRIPTIONS.CANCEL).toBe('string');
    });

    it('PLAN_DETAIL works with slug', function () {
      expect(SUBSCRIPTIONS.PLAN_DETAIL('premium')).toBe('/api/subscriptions/plans/premium/');
    });
  });

  describe('STORE endpoints', function () {
    it('ITEM_DETAIL works with slug', function () {
      expect(STORE.ITEM_DETAIL('cool-hat')).toBe('/api/store/items/cool-hat/');
    });

    it('EQUIP works with ID', function () {
      expect(STORE.EQUIP(42)).toBe('/api/store/inventory/42/equip/');
    });

    it('GIFT_CLAIM works', function () {
      expect(STORE.GIFT_CLAIM(7)).toBe('/api/store/gifts/7/claim/');
    });
  });

  describe('SOCIAL endpoints', function () {
    it('FRIENDS sub-endpoints exist', function () {
      expect(typeof SOCIAL.FRIENDS.LIST).toBe('string');
      expect(typeof SOCIAL.FRIENDS.REQUEST).toBe('string');
      expect(SOCIAL.FRIENDS.ACCEPT(1)).toBe('/api/social/friends/accept/1/');
      expect(SOCIAL.FRIENDS.REMOVE(5)).toBe('/api/social/friends/remove/5/');
    });

    it('POSTS sub-endpoints work', function () {
      expect(SOCIAL.POSTS.LIKE(1)).toBe('/api/social/posts/1/like/');
      expect(SOCIAL.POSTS.COMMENT(1)).toBe('/api/social/posts/1/comment/');
      expect(SOCIAL.POSTS.USER(5)).toBe('/api/social/posts/user/5/');
    });

    it('STORIES sub-endpoints work', function () {
      expect(SOCIAL.STORIES.VIEW(1)).toBe('/api/social/stories/1/view/');
      expect(SOCIAL.STORIES.DELETE(1)).toBe('/api/social/stories/1/');
    });
  });

  describe('CIRCLES endpoints', function () {
    it('dynamic endpoints work', function () {
      expect(CIRCLES.DETAIL(1)).toBe('/api/circles/circles/1/');
      expect(CIRCLES.JOIN(1)).toBe('/api/circles/circles/1/join/');
      expect(CIRCLES.LEAVE(1)).toBe('/api/circles/circles/1/leave/');
    });

    it('multi-param functions work', function () {
      expect(CIRCLES.POST_EDIT(1, 2)).toBe('/api/circles/circles/1/posts/2/edit/');
      expect(CIRCLES.CHALLENGE_LEADERBOARD(1, 3)).toBe(
        '/api/circles/circles/1/challenges/3/leaderboard/',
      );
      expect(CIRCLES.MEMBER_PROMOTE(1, 5)).toBe(
        '/api/circles/circles/1/members/5/promote/',
      );
    });

    it('JOIN_BY_CODE works', function () {
      expect(CIRCLES.JOIN_BY_CODE('ABCD')).toBe('/api/circles/circles/join/ABCD/');
    });
  });

  describe('BUDDIES endpoints', function () {
    it('has expected endpoints', function () {
      expect(typeof BUDDIES.CURRENT).toBe('string');
      expect(typeof BUDDIES.FIND_MATCH).toBe('string');
    });

    it('dynamic endpoints work', function () {
      expect(BUDDIES.ACCEPT(1)).toBe('/api/buddies/1/accept/');
      expect(BUDDIES.PROGRESS(1)).toBe('/api/buddies/1/progress/');
    });

    it('CONTRACTS sub-endpoints work', function () {
      expect(BUDDIES.CONTRACTS.ACCEPT(1)).toBe('/api/buddies/contracts/1/accept/');
      expect(BUDDIES.CONTRACTS.CHECK_IN(1)).toBe('/api/buddies/contracts/1/check-in/');
    });
  });

  describe('LEAGUES endpoints', function () {
    it('has leaderboard sub-endpoints', function () {
      expect(typeof LEAGUES.LEADERBOARD.GLOBAL).toBe('string');
      expect(typeof LEAGUES.LEADERBOARD.FRIENDS).toBe('string');
    });

    it('SEASONS sub-endpoints work', function () {
      expect(LEAGUES.SEASONS.CLAIM_REWARD(1)).toBe('/api/leagues/seasons/1/claim-reward/');
    });

    it('LEAGUE_SEASONS work', function () {
      expect(LEAGUES.LEAGUE_SEASONS.LEADERBOARD(1)).toBe(
        '/api/leagues/league-seasons/1/leaderboard/',
      );
    });
  });

  describe('WS endpoints', function () {
    it('AI_CHAT returns correct WebSocket path', function () {
      expect(WS.AI_CHAT(42)).toBe('/ws/ai-chat/42/');
    });

    it('BUDDY_CHAT returns correct path', function () {
      expect(WS.BUDDY_CHAT(7)).toBe('/ws/buddy-chat/7/');
    });

    it('CIRCLE_CHAT returns correct path', function () {
      expect(WS.CIRCLE_CHAT(3)).toBe('/ws/circle-chat/3/');
    });

    it('static WS paths are strings', function () {
      expect(typeof WS.NOTIFICATIONS).toBe('string');
      expect(typeof WS.SOCIAL_FEED).toBe('string');
      expect(typeof WS.LEAGUE).toBe('string');
    });
  });

  describe('all endpoints completeness', function () {
    it('all string endpoints return non-empty strings', function () {
      var modules = [AUTH, USERS, DREAMS, CONVERSATIONS, CALENDAR, NOTIFICATIONS, SUBSCRIPTIONS, STORE, LEAGUES, CIRCLES, SOCIAL, BUDDIES, SEARCH, APP_UPDATES, WS];
      modules.forEach(function (mod) {
        var entries = collectEndpoints(mod);
        entries.forEach(function (entry) {
          if (entry.type === 'string') {
            expect(entry.value.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('all function endpoints return strings when called', function () {
      var modules = [AUTH, USERS, DREAMS, CONVERSATIONS, CALENDAR, NOTIFICATIONS, SUBSCRIPTIONS, STORE, LEAGUES, CIRCLES, SOCIAL, BUDDIES];
      modules.forEach(function (mod) {
        var entries = collectEndpoints(mod);
        entries.forEach(function (entry) {
          if (entry.type === 'function') {
            // Call with dummy args
            var result = entry.value(1, 2);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
});
