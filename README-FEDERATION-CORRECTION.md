# README federation correction

The README now reflects the actual Vite configuration in this bundle:
- Shell uses `@originjs/vite-plugin-federation` and declares Dashboard / Trade as remotes.
- Dashboard and Trade expose modules through `remoteEntry.js`.
- Angular Payment and Vue Analytics are loaded as separate assets and rendered as Custom Elements.
- Shared npm workspace contracts and browser `CustomEvent`s remain separate concerns from module loading.
