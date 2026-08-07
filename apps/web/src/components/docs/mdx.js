import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';

export function getMDXComponents(components) {
  return { ...defaultMdxComponents, Step, Steps, ...components };
}

export const useMDXComponents = getMDXComponents;
