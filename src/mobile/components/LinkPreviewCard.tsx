import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native'
import { Play } from 'phosphor-react-native'

import { colors, fontSize, fontFamily, space, radius } from '../constants/tokens'
import type { LinkPreview } from '../lib/api'

interface Props {
  preview: LinkPreview
  theme:   typeof colors.light
}

export default function LinkPreviewCard({ preview, theme }: Props) {
  const styles = makeStyles(theme)

  const displayDomain = (() => {
    try { return new URL(preview.canonical_url ?? preview.url).hostname.replace(/^www\./, '') }
    catch { return preview.site_name ?? '' }
  })()

  const handlePress = () => {
    const dest = preview.canonical_url ?? preview.url
    Linking.openURL(dest).catch(() => {})
  }

  if (preview.is_youtube && preview.youtube_id) {
    const thumb = preview.image_url ?? `https://img.youtube.com/vi/${preview.youtube_id}/hqdefault.jpg`
    return (
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={handlePress}>
        <View style={styles.youtubeThumbWrap}>
          <Image source={{ uri: thumb }} style={styles.youtubeThumb} resizeMode="cover" />
          <View style={styles.playBadge}>
            <Play size={20} color="#fff" weight="fill" />
          </View>
        </View>
        <View style={styles.meta}>
          <View style={styles.siteLine}>
            <View style={styles.ytBadge}>
              <Text style={styles.ytBadgeText}>{'YouTube'}</Text>
            </View>
          </View>
          {preview.title ? (
            <Text style={styles.title} numberOfLines={2}>{preview.title}</Text>
          ) : null}
        </View>
      </Pressable>
    )
  }

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={handlePress}>
      {preview.image_url ? (
        <Image source={{ uri: preview.image_url }} style={styles.image} resizeMode="cover" />
      ) : null}
      <View style={styles.meta}>
        {displayDomain ? (
          <Text style={styles.domain} numberOfLines={1}>{displayDomain}</Text>
        ) : null}
        {preview.title ? (
          <Text style={styles.title} numberOfLines={2}>{preview.title}</Text>
        ) : null}
        {preview.description ? (
          <Text style={styles.description} numberOfLines={2}>{preview.description}</Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const makeStyles = (c: typeof colors.light) => StyleSheet.create({
  card: {
    borderRadius:    radius.lg,
    overflow:        'hidden',
    backgroundColor: c.bgSurface,
    borderWidth:     1,
    borderColor:     c.border,
    marginTop:       space[3],
  },

  // Standard image
  image: {
    width:      '100%',
    height:     160,
    backgroundColor: c.bgElevated,
  },

  // YouTube thumbnail
  youtubeThumbWrap: {
    position: 'relative',
    width:    '100%',
    height:   180,
    backgroundColor: '#000',
  },
  youtubeThumb: {
    width:  '100%',
    height: '100%',
  },
  playBadge: {
    position:        'absolute',
    bottom:          space[3],
    right:           space[3],
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Metadata
  meta: {
    padding: space[3],
    gap:     space[1],
  },
  siteLine: {
    flexDirection:  'row',
    alignItems:     'center',
    marginBottom:   space[1],
  },
  domain: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom:  2,
  },
  title: {
    fontSize:   fontSize.sm,
    fontFamily: fontFamily.loraBold,
    color:      c.textPrimary,
    lineHeight: 20,
  },
  description: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.inter,
    color:      c.textSecondary,
    lineHeight: 17,
    marginTop:  2,
  },

  // YouTube badge
  ytBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: space[2],
    paddingVertical:   2,
    borderRadius:      3,
  },
  ytBadgeText: {
    fontSize:   fontSize.xs,
    fontFamily: fontFamily.interBold,
    color:      '#fff',
    letterSpacing: 0.3,
  },
})
