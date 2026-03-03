# NextClaw Desktop Install Guide (macOS / Windows)

This is a beginner-friendly guide with only the steps you need.

## Download the correct file

- macOS (Apple Silicon): `NextClaw Desktop-<version>-arm64.dmg`
- Windows: `NextClaw Desktop Setup <version>.exe`

After installation, users can run the app directly. Node is not required.

## macOS install

1. Open the `.dmg`.
2. Drag `NextClaw Desktop.app` into `Applications`.
3. Open `NextClaw Desktop` from Applications.

If macOS says it cannot open the app:
1. Go to `System Settings -> Privacy & Security`.
2. Click "Open Anyway".

If macOS says the app is "damaged":
1. Open Terminal.
2. Run the command below, then open the app again:

```bash
xattr -dr com.apple.quarantine "/Applications/NextClaw Desktop.app"
```

## Windows install

1. Run `NextClaw Desktop Setup <version>.exe`.
2. If SmartScreen appears, click `More info`, then `Run anyway`.
3. Complete the installer.

## Updates

- The app checks updates automatically.
- When a new version is ready, the app prompts you to restart and install.
- You can also manually download the latest installer and reinstall.

## Uninstall (macOS)

1. Quit `NextClaw Desktop`.
2. Delete `/Applications/NextClaw Desktop.app`.
3. If you also want to remove local data, delete `~/.nextclaw`.
