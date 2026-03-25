/**
 * usePrivacyPolicyScreen -- business logic for Privacy Policy (React Native).
 * Synced with web app's usePrivacyPolicyScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { adaptColor } = require('../../../styles/colors');
var { useT } = require('../../../context/I18nContext');

var SECTIONS = [
  {
    title: '1. Information We Collect',
    text: 'We collect information you provide directly: your name, email address, profile information, dreams, goals, and task data. We also automatically collect usage data including app interactions, device information, and performance metrics to improve our services.',
  },
  {
    title: '2. How We Use Your Information',
    text: "Your information is used to: provide and personalize the Stepora experience; power the AI Coach with context about your goals; track your progress and generate insights; send notifications and reminders you've opted into; improve our services through aggregated, anonymized analytics.",
  },
  {
    title: '3. AI Data Processing',
    text: 'Your dreams, goals, and conversations with the AI Coach are processed to provide personalized guidance. This data is encrypted in transit and at rest. AI interactions are not used to train models shared with other users. You can delete your AI conversation history at any time.',
  },
  {
    title: '4. Data Sharing',
    text: 'We do not sell your personal data. We may share information with: service providers who help operate our platform (hosting, analytics); other users only when you explicitly choose to share (social features, circles, buddy system); law enforcement when required by valid legal process.',
  },
  {
    title: '5. Social Features',
    text: 'When you use social features like circles, buddy matching, or the leaderboard, certain profile information becomes visible to other users. You can control your visibility in the privacy settings. Shared dreams and progress are only visible to connections you approve.',
  },
  {
    title: '6. Data Security',
    text: 'We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 for data in transit, and regular security audits. Access to user data is restricted to authorized personnel on a need-to-know basis. We maintain SOC 2 Type II compliance.',
  },
  {
    title: '7. Data Retention',
    text: 'We retain your account data as long as your account is active. After account deletion, personal data is purged within 30 days, except where retention is required by law. Anonymized, aggregated data may be retained indefinitely for analytics purposes.',
  },
  {
    title: '8. Your Rights',
    text: 'You have the right to: access and download your personal data; correct inaccurate information; delete your account and associated data; opt out of non-essential communications; restrict processing of your data; port your data to another service. Exercise these rights through Settings or by contacting privacy@stepora.app.',
  },
  {
    title: "9. Children's Privacy",
    text: 'Stepora is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover such data has been collected, we will delete it promptly.',
  },
  {
    title: '10. Contact Us',
    text: 'For privacy-related questions or concerns, contact our Data Protection Officer at privacy@stepora.app. We will respond to all privacy inquiries within 30 days.',
  },
];

function usePrivacyPolicyScreen() {
  var navigation = useNavigation();
  var { t } = useT();
  var [mounted, setMounted] = useState(false);

  useEffect(function () {
    setTimeout(function () {
      setMounted(true);
    }, 50);
  }, []);

  return {
    navigation: navigation,
    t: t,
    mounted: mounted,
    SECTIONS: SECTIONS,
    adaptColor: adaptColor,
  };
}

module.exports = usePrivacyPolicyScreen;
