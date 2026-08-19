const { withAndroidManifest } = require('@expo/config-plugins')

const PROPERTY_NAME = 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY'

// Apps targeting API 36 have their orientation and resizability restrictions ignored on
// displays of 600dp or wider, so the portrait lock in app.json stops applying to tablets
// and unfolded foldables. This opt-out restores it. Android honours the property only
// while the app targets API 36 — moving to 37 requires real landscape layouts instead.
const withRestrictedResizability = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    const application = manifestConfig.modResults.manifest.application?.[0]

    if (application === undefined) {
      throw new Error('withRestrictedResizability: <application> missing from AndroidManifest.xml')
    }

    const otherProperties = (application.property ?? []).filter(
      (property) => property.$?.['android:name'] !== PROPERTY_NAME
    )

    application.property = [
      ...otherProperties,
      {
        $: {
          'android:name': PROPERTY_NAME,
          'android:value': 'true'
        }
      }
    ]

    return manifestConfig
  })

module.exports = withRestrictedResizability
