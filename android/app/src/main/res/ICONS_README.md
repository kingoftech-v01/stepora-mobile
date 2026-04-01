# Android Mipmap Icons

The following icon files must be placed in the mipmap directories before building a release APK.

## Launcher Icons (ic_launcher.png)

| Directory       | Size (px) |
|-----------------|-----------|
| mipmap-mdpi     | 48x48     |
| mipmap-hdpi     | 72x72     |
| mipmap-xhdpi    | 96x96     |
| mipmap-xxhdpi   | 144x144   |
| mipmap-xxxhdpi  | 192x192   |

## Notification Icons (ic_notification.png)

Must be white-on-transparent, single-color silhouette (Android design guidelines).

| Directory       | Size (px) |
|-----------------|-----------|
| mipmap-mdpi     | 24x24     |
| mipmap-hdpi     | 36x36     |
| mipmap-xhdpi    | 48x48     |
| mipmap-xxhdpi   | 72x72     |
| mipmap-xxxhdpi  | 96x96     |

## How to Generate

1. Use Android Studio: File > New > Image Asset (recommended).
2. Or use an online tool like https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
3. Place the generated PNGs into the corresponding mipmap-* directories.

## Optional: Round Icons (ic_launcher_round.png)

Android 7.1+ supports round launcher icons. Generate them alongside ic_launcher.png using the same sizes listed above.
