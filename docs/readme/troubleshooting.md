#### Build Troubleshooting

Unfortunately, the build system may fail to pick up local changes, such as installing new NPM packages or `yarn link`ing a dependency.
If the app is behaving strangely or not picking up your local changes, it may be due to build issues.
To ensure that you're starting with a clean slate, close all emulators/simulators, stop the `yarn watch` process, and run:

```bash
yarn clean

# if you're going to `yarn link` any packages,
# do that here, before the next command

yarn watch:clean

# ...and then, in another terminal

yarn start:ios

# or

yarn start:android
```

If `yarn link` fails after going through these steps, try directly `yarn add`ing the local files instead.

#### `yarn install` fails on a GitHub dependency

Some dependencies are resolved from GitHub rather than the npm registry. If one of those
repositories is deleted or renamed, `yarn install` fails with a 404 while fetching it and no
`node_modules` directory is produced. Check the failing URL in the yarn output against the
matching entry in `package.json` and update it to a maintained fork or a registry version.
