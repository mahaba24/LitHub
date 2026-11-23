import { useCallback, useState } from 'react';

import { ReportSheet } from '@/components/safety/report-sheet';
import { useBlockActions, useBlockedIds } from '@/hooks/use-blocks';
import { confirm, notify } from '@/lib/confirm';
import { BLOCK_EXPLANATION, type ReportSource } from '@/types/safety';

type Target = {
  uid: string | undefined;
  name: string;
  source: ReportSource;
  requestId?: string;
};

/**
 * Report / block / unblock for one other user, shared by the profile screen
 * and the chat header. Render `reportSheet` somewhere in the screen.
 */
export function useUserSafety({ uid, name, source, requestId }: Target) {
  const { blockedIds } = useBlockedIds();
  const { status, block, unblock } = useBlockActions();
  const [reportOpen, setReportOpen] = useState(false);
  const isBlocked = !!uid && blockedIds.has(uid);

  const confirmAndBlock = useCallback(async () => {
    if (!uid) return;
    const ok = await confirm({
      title: `Block ${name}?`,
      message: BLOCK_EXPLANATION,
      confirmLabel: 'Block',
      destructive: true,
    });
    if (!ok) return;
    try {
      await block(uid);
    } catch (error) {
      console.warn('block failed', error);
      notify('Couldn’t block', 'Something went wrong. Check your connection and try again.');
    }
  }, [uid, name, block]);

  const confirmAndUnblock = useCallback(async () => {
    if (!uid) return;
    const ok = await confirm({
      title: `Unblock ${name}?`,
      message: 'You’ll be able to send each other requests and messages again, and you’ll see their books. You won’t automatically follow them again.',
      confirmLabel: 'Unblock',
    });
    if (!ok) return;
    try {
      await unblock(uid);
    } catch (error) {
      console.warn('unblock failed', error);
      notify('Couldn’t unblock', 'Something went wrong. Check your connection and try again.');
    }
  }, [uid, name, unblock]);

  const reportSheet = uid ? (
    <ReportSheet
      visible={reportOpen}
      onClose={() => setReportOpen(false)}
      reportedUserId={uid}
      reportedName={name}
      source={source}
      requestId={requestId}
    />
  ) : null;

  return {
    isBlocked,
    busy: status === 'submitting',
    openReport: () => setReportOpen(true),
    confirmAndBlock,
    confirmAndUnblock,
    reportSheet,
  };
}
