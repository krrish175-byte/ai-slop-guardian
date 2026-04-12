# `npx-import-light`

### Import modules and load them if needed deferred from npm

```js
import { npxImport } from 'npx-import-light'

// If cowsay isn't installed locally, npxImport will try
// to download, install & load it, completely seamlessly.
const dependency = await npxImport('cowsay')
```

Based on [`npx-import`](https://github.com/geelen/npx-import).
