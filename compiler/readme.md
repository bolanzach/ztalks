# ZCompiler

#### A silly little library that helps make building static sites fun again

## Usage

Typescript API:

```typescript
import { Compile, GetFileNamesInDir } from 'zcompiler';

const pagesPaths = GetFileNamesInDir('path/to/pages');

Compile({
    componentDir: 'path/to/components',
    pagesPaths,
    outputDir: 'dist',
});
```

## Features

It's fucking awesome.


#### ✨ Specify reusable HTML in components

A component is just an HTML file

**components/hello.html**
```html
<div>
    <h1>Hello world</h1>
</div>
```

Now you can easily scream to the world wherever you want! This produces what you'd expect.

**index.html**
```html
<z component="hello"></z>
<z component="hello"></z>
<z component="hello"></z>
```

---

#### ✨ Yield stuff

**components/yield-hello.html**
```html
<div>
    <h1>Hello world</h1>
    <z yield></z>
</div>
```

**index.html**
```html
<z component="yield-hello">
    Hell yeah brother
</z>
```

When compiled, produces:
```html
<div>
    <h1>Hello world</h1>
    Hell yeah brother
</div>
```

---

#### ✨ Pass in props/attributes

Ohh yeah

**components/yield-hello-attr.html**
```html
<div>
    <h1>Hello <% name %></h1>
    <z yield></z>
</div>
```

**index.html**
```html
<z component="yield-hello-attr" name="dope boy">
    Hell yeah brother
</z>
```

## In the future

Maybe I'll add some mechanics to perform basic branching and looping logic. That might get too powerful though... they only asked _if_ I could do it, never if I _should_.
