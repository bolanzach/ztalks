import {
  DOMParser,
  Element,
  HTMLDocument,
  NamedNodeMap,
  NodeList,
} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const APP_DIR = Deno.cwd();
const Z_TAG_ELEMENT_SELECTOR = "z";
const Z_TAG_INCLUDE_COMPONENT_ATTR = "component";
const Z_TAG_YIELD_ATTR = "yield";
const INCLUDE_HTML_MACRO = "<!-- z-macro-include-html -->";

/**
 * Returns an array of file names in the given directory
 */
async function getFiles(path: string): Promise<string[]> {
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

// Register components
const REGISTERED_COMPONENTS: Record<string, string> = {};
const componentPaths = await getFiles("components");
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

async function processFile(filePath: string): Promise<string | undefined> {
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
    processElement(zTemplate);
  }

  return fileDom.querySelector("html")?.outerHTML;
}

function processElement(element: Element): void {
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
  const layout = assignAttributeProps(REGISTERED_COMPONENTS[filePath], props);
  const componentHtml = parseStringToHtml(layout);

  if (componentHtml.childElementCount > 1) {
    throw `The component: ${filePath} can only have a single root element`;
  }

  const component = componentHtml.querySelector("*");
  if (!component) {
    throw `Could not create DOM for component: ${filePath}`;
  }

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

function assignAttributeProps(layout: string, props: NamedNodeMap) {
  let hydratedLayout = layout;
  for (let i = 0; i < props.length; i++) {
    const prop = props.item(i);
    const propReplace = `<% ${prop?.nodeName} %>`;
    hydratedLayout = hydratedLayout.replaceAll(
      propReplace,
      prop?.value ?? propReplace
    );
  }

  return hydratedLayout;
}

///
/// Using the "library"
///

const blogPaths = await getFiles("blog");
blogPaths.push("index.html");
blogPaths.forEach(async (filePath) => {
  const file = await processFile(filePath);

  console.log(`Generated file: ${filePath}`);

  await Deno.writeTextFile(`${APP_DIR}/dist/${filePath}`, file ?? "");
});
