/**
 * useTermsOfServiceScreen -- business logic for Terms of Service (React Native).
 * Synced with web app's useTermsOfServiceScreen.js.
 */
var { useState, useEffect } = require('react');
var { useNavigation } = require('@react-navigation/native');
var { useT } = require('../../../context/I18nContext');

var SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    text: 'By accessing or using Stepora, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to update these terms at any time, and your continued use constitutes acceptance of any changes.',
  },
  {
    title: '2. User Accounts',
    text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. You may not share your account with others or create multiple accounts.',
  },
  {
    title: '3. Dream Content & Data',
    text: 'You retain ownership of all dreams, goals, and personal content you create within Stepora. By using our services, you grant us a limited license to process and store your content for the purpose of providing our services. We will not sell or share your personal dream data with third parties for advertising purposes.',
  },
  {
    title: '4. AI Coach Disclaimer',
    text: 'The AI Coach feature provides motivational guidance and goal-tracking assistance only. It is not a substitute for professional advice including but not limited to medical, financial, legal, or psychological counseling. Stepora and its AI features are tools to help you organize and pursue your personal goals.',
  },
  {
    title: '5. Acceptable Use',
    text: 'You agree not to use Stepora to: (a) violate any applicable laws or regulations; (b) harass, abuse, or harm other users; (c) upload malicious content or attempt to compromise system security; (d) create fake accounts or misrepresent your identity; (e) use automated systems to access the service without permission.',
  },
  {
    title: '6. Virtual Currency & Store',
    text: 'XP points and virtual items earned or purchased within Stepora have no real-world monetary value and cannot be exchanged for cash. We reserve the right to modify, limit, or discontinue virtual items and currencies at any time. Purchases of premium features are non-refundable except where required by law.',
  },
  {
    title: '7. Community Guidelines',
    text: 'When interacting with other users through circles, buddy features, or social functions, you must treat others with respect. Content that is hateful, discriminatory, sexually explicit, or promotes violence is strictly prohibited and may result in immediate account termination.',
  },
  {
    title: '8. Termination',
    text: 'We may suspend or terminate your account at any time for violations of these terms. You may delete your account at any time through the app settings. Upon termination, your right to use the service ceases immediately, though we may retain certain data as required by law.',
  },
  {
    title: '9. Limitation of Liability',
    text: 'Stepora is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for premium services in the 12 months preceding the claim.',
  },
  {
    title: '10. Contact',
    text: 'If you have questions about these Terms of Service, please contact us at legal@stepora.app or through the in-app support feature.',
  },
];

function useTermsOfServiceScreen() {
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
  };
}

module.exports = useTermsOfServiceScreen;
