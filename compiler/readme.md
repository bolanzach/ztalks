# ZCompiler

#### My own little Static Site Generator

Main use is when you don't mind writing your own HTML, but you want to make it a bit more modular and reusable.

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

A component is just an HTML file.

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

Inspired by [Ember](https://guides.emberjs.com/release/components/block-content), use the special `<z yield>` as a placholder so that consumers can specify the content.

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

Ohh yeah, it can pass some data around.

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

> :warning: **All data is stringified**


## In the future

The `<z>` tag is a little weird given that most people are familiar with custom elements. If anything, maybe it could be configurable to a different tag, so that I don't appear so conceited throwin' Zs everywhere. I might also add some mechanics to perform basic branching and looping logic, and improve data passing. That might get too powerful though... they only asked _if_ I could do it, never if I _should_.
