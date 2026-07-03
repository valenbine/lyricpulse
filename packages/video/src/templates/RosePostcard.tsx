import type { LyricVideoConfig } from '@lyricpulse/core'
import { ProfileTemplate, rosePostcardProfile } from './profile-template'

export function RosePostcard({ config }: { config: LyricVideoConfig }) {
  return <ProfileTemplate config={config} profile={rosePostcardProfile} />
}
