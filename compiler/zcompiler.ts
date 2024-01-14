import {
  DOMParser,
  Element,
  HTMLDocument,
  NamedNodeMap,
  NodeList,
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

/*
////////////////////////////

The Z Compiler

///////////////////////////
*/

const APP_DIR = Deno.cwd();
const Z_TAG_ELEMENT_SELECTOR = "z";
const Z_TAG_INCLUDE_COMPONENT_ATTR = "component";
const Z_TAG_YIELD_ATTR = "yield";
const INCLUDE_HTML_MACRO = "<!-- z-macro-include-html -->";

// Mapping of components (filenames) to their HTML
const REGISTERED_COMPONENTS: Record<string, string> = {};

interface CompileProps {
  componentsDir: string;
  pagesPaths: string[];
  outDir: string;
}

/**
 * Returns an array of file names in the given directory
 */
export async function GetFileNamesInDir(path: string): Promise<string[]> {
  const fileNames: string[] = [];

  for await (const dirEntry of Deno.readDir(`${APP_DIR}/${path}`)) {
    if (dirEntry.isFile) {
      fileNames.push(`${path}/${dirEntry.name}`);
    }
  }

  return fileNames;
}

function parseStringToHtml(file: string): Element | HTMLDocument {
  const fileDom = new DOMParser().parseFromString(file, "text/html");

  if (!fileDom) {
    throw `Could not create DOM for file: ${file}`;
  }

  return file.includes(INCLUDE_HTML_MACRO) ? fileDom : fileDom.body;
}

const componentPaths = await GetFileNamesInDir("components");
componentPaths.forEach(async (filePath) => {
  const file = await Deno.readTextFile(`${APP_DIR}/${filePath}`);

  const [fileName] = filePath.split(".");
  const key = fileName.split("/").pop();

  if (key) {
    REGISTERED_COMPONENTS[key] = file;
  }
});

function isElementZTemplate(element: Element): boolean {
  return (
    element.localName === Z_TAG_ELEMENT_SELECTOR &&
    element.hasAttribute(Z_TAG_INCLUDE_COMPONENT_ATTR)
  );
}

async function compilePage(filePath: string): Promise<string | undefined> {
  const file = await Deno.readTextFile(`${APP_DIR}/${filePath}`);
  // const fileDom = new DOMParser().parseFromString(file, "text/html");
  const fileDom = parseStringToHtml(file);

  if (!fileDom) {
    throw "Could not create DOM for file";
  }

  let zTemplate: Element;

  while (
    (zTemplate = fileDom.getElementsByTagName(Z_TAG_ELEMENT_SELECTOR)[0])
  ) {
    processZElement(zTemplate);
  }

  return fileDom.querySelector("html")?.outerHTML;
}

function processZElement(element: Element): void {
  if (!isElementZTemplate(element)) {
    element.remove();
    return;
  }

  const path = element?.attributes.getNamedItem(
    Z_TAG_INCLUDE_COMPONENT_ATTR
  )?.value;
  if (!path) {
    throw "Could not get the 'component' attribute";
  }

  const yielded = processComponent(
    path,
    element.childNodes,
    element.attributes
  );

  element.replaceWith(...[yielded]);
}

function processComponent(
  filePath: string,
  yieldTo: NodeList,
  props: NamedNodeMap
): Element {
  const layout = compileDynamicAttributeProps(REGISTERED_COMPONENTS[filePath], props);
  const componentHtml = parseStringToHtml(layout);

  if (componentHtml.childElementCount > 1) {
    throw `The component: ${filePath} can only have a single root element`;
  }

  const component = componentHtml.querySelector("*");
  if (!component) {
    throw `Could not create DOM for component: ${filePath}`;
  }

  // Check if the component has a yield attribute. If so, replace it with the yieldTo content
  const yieldElement = component.getElementsByTagName(
    Z_TAG_ELEMENT_SELECTOR
  )[0];
  const yieldAttr = yieldElement?.attributes.getNamedItem(Z_TAG_YIELD_ATTR);

  if (!yieldElement || !yieldAttr) {
    return component;
  }

  yieldElement.replaceWith(...yieldTo);

  return component;
}

function compileDynamicAttributeProps(layout: string, props: NamedNodeMap) {
  let hydratedHtmlString = layout;
  for (let i = 0; i < props.length; i++) {
    const prop = props.item(i);
    const propReplace = `<% ${prop?.nodeName} %>`;
    hydratedHtmlString = hydratedHtmlString.replaceAll(
      propReplace,
      prop?.value ?? propReplace
    );
  }

  return hydratedHtmlString;
}

/**
 * Public API to compile the static site with pages and components
 */
export async function Compile({ componentsDir, pagesPaths, outDir }: CompileProps) {
  const componentPaths = await GetFileNamesInDir(componentsDir);

  // Iterate through all components and register them
  componentPaths.forEach(async (filePath) => {
    const file = await Deno.readTextFile(`${APP_DIR}/${filePath}`);

    const [fileName] = filePath.split(".");
    const key = fileName.split("/").pop();

    if (key) {
      REGISTERED_COMPONENTS[key] = file;
    }
  });

  // Iterate through all pages and compile them with components
  pagesPaths.forEach(async (filePath) => {
    const file = await compilePage(filePath);
  
    console.log(`Generated file: ${filePath}`);
  
    await Deno.writeTextFile(`${APP_DIR}/${outDir}/${filePath}`, file ?? "");
  });
}

///
/// Using the compiler
///

Compile({
  componentsDir: 'components',
  pagesPaths: ['index.html'],
  outDir: 'dist',
});
