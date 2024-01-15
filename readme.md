# [zachbolan.com](https://www.zachbolan.com)

### Local Development

**Dependencies**

- `Deno`
- `Sass`

To compile the project run:

```bash
yarn build
```

This will generate the appropriate files in the `/dist` directory. The files to serve exist in dist - it's plain old static HTML so you can view the site locally at `path/to/ztalks/dist/index.html`.

> At the moment, the compiler messes up at times when adding new components or pages. Usually running the compiler again will fix it.

> You should manually create a `/dist` folder as the compiler will not create it. This allows you to add other static files, like images, to the build.
