import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';

// TODO: replace before submitting to the app stores.
const SUPPORT_EMAIL = '[support email]';
const LAST_UPDATED = 'November 2026';

type Section = { title: string; body: string[] };

const SECTIONS: Section[] = [
  {
    title: 'What we store',
    body: [
      'Account: your email address and the display name you choose. Your password is handled by Firebase Authentication and we never see it.',
      'Location (optional): only if you tap Share. We round it to about 1 km before saving it, and use it to show how far away books are. We never store your address.',
      'Books you list: title, author, cover, genre, condition, description, ISBN if you add one, and your approximate location at the time you listed it.',
      'Borrow requests: which book, who is borrowing and lending, the due dates you propose and agree on, and any damage report.',
      'Messages you send in request chats.',
      'Reviews you write, and the ratings and trust score that other people’s reviews and your completed exchanges give you.',
      'The readers you follow.',
      'People you block: just who you blocked and when.',
      'Reports you send: who you reported, the reason you picked, your note if you wrote one, and which chat it came from if you reported from a chat.',
    ],
  },
  {
    title: 'Who can see it',
    body: [
      'Other signed-in LitHub users can see your display name, approximate location, listed books, reviews, trust score and who you follow.',
      'Your requests and chat messages are visible only to you and the other person in that exchange.',
      'Your block list is private. Blocked people aren’t told, but they can’t send you borrow requests or messages, and you can’t contact them. Their books are hidden from you.',
      'Reports can only be read by the LitHub team, using Firebase’s admin tools. They are never shown in the app, not to the person you reported and not to you.',
    ],
  },
  {
    title: 'Where it’s stored',
    body: [
      'Everything is stored in Google Firebase (Authentication, Cloud Firestore and Cloud Functions). Google processes it on our behalf to run the app.',
    ],
  },
  {
    title: 'What we don’t do',
    body: [
      'No ads, no ad tracking, and we don’t sell or share your data with advertisers or data brokers.',
      'No payments: LitHub is free, and nothing is bought or sold in the app. Any damage fee is settled between you in person.',
      'Exchanges happen in person. We don’t collect shipping addresses.',
    ],
  },
  {
    title: 'Deleting your account',
    body: [
      'You can delete your account at any time from Account › Delete my account.',
      'This permanently deletes your login, profile, location, listed books, follow records and block list.',
      'Safety reports, both ones you sent and ones about you, are kept so we can act on safety problems.',
      'Messages you sent, reviews you wrote and past requests stay, so the other person’s history still makes sense, but your name on them is replaced with “Deleted user”.',
    ],
  },
  {
    title: 'Contact',
    body: [`Questions or requests about your data: ${SUPPORT_EMAIL}`],
  },
];

export default function PrivacyScreen() {
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');

  return (
    <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
      <ThemedText style={[styles.intro, { color: muted }]}>
        LitHub helps neighbours lend books to each other in person. This page explains, in plain language, what
        information the app keeps and why. Last updated {LAST_UPDATED}.
      </ThemedText>

      {SECTIONS.map((section) => (
        <Card key={section.title} title={section.title}>
          <View style={styles.cardBody}>
            {section.body.map((paragraph) => (
              <ThemedText key={paragraph} style={styles.paragraph}>
                {paragraph}
              </ThemedText>
            ))}
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },
  intro: {
    fontSize: 15,
    lineHeight: 21,
    marginHorizontal: 16,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 21,
  },
});
