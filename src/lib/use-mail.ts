import { atom, useAtom } from 'jotai'
import { Ticket } from '@/types/tickos'

type MailConfig = {
  selected: Ticket['id'] | null
  selectedInboxId: string | null
}

const configAtom = atom<MailConfig>({
  selected: null,
  selectedInboxId: null,
})

export function useMail() {
  return useAtom(configAtom)
}
