import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs-dev-mode/__docusaurus/debug',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug', '8eb'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/config',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/config', 'c8f'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/content',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/content', '288'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/globalData',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/globalData', '430'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/metadata',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/metadata', 'f79'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/registry',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/registry', 'cf2'),
    exact: true
  },
  {
    path: '/docs-dev-mode/__docusaurus/debug/routes',
    component: ComponentCreator('/docs-dev-mode/__docusaurus/debug/routes', 'd5d'),
    exact: true
  },
  {
    path: '/docs-dev-mode/api',
    component: ComponentCreator('/docs-dev-mode/api', 'f4d'),
    exact: true
  },
  {
    path: '/docs-dev-mode/markdown-page',
    component: ComponentCreator('/docs-dev-mode/markdown-page', '62e'),
    exact: true
  },
  {
    path: '/docs-dev-mode/docs',
    component: ComponentCreator('/docs-dev-mode/docs', '452'),
    routes: [
      {
        path: '/docs-dev-mode/docs',
        component: ComponentCreator('/docs-dev-mode/docs', '8f4'),
        routes: [
          {
            path: '/docs-dev-mode/docs',
            component: ComponentCreator('/docs-dev-mode/docs', '558'),
            routes: [
              {
                path: '/docs-dev-mode/docs/api-specification/calculator-model-generated',
                component: ComponentCreator('/docs-dev-mode/docs/api-specification/calculator-model-generated', 'ad9'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/api-specification/design-api-intro',
                component: ComponentCreator('/docs-dev-mode/docs/api-specification/design-api-intro', 'a27'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/api-specification/openapi-spec',
                component: ComponentCreator('/docs-dev-mode/docs/api-specification/openapi-spec', '8d4'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/category/api-specification',
                component: ComponentCreator('/docs-dev-mode/docs/category/api-specification', '619'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/category/requirements-specification',
                component: ComponentCreator('/docs-dev-mode/docs/category/requirements-specification', '815'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/category/system-architecture',
                component: ComponentCreator('/docs-dev-mode/docs/category/system-architecture', 'c87'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/category/test-procedures',
                component: ComponentCreator('/docs-dev-mode/docs/category/test-procedures', '69b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/intro',
                component: ComponentCreator('/docs-dev-mode/docs/intro', '996'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/requirements/features-and-requirements',
                component: ComponentCreator('/docs-dev-mode/docs/requirements/features-and-requirements', '176'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/requirements/general-requirements',
                component: ComponentCreator('/docs-dev-mode/docs/requirements/general-requirements', 'e40'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/requirements/system-block-diagram',
                component: ComponentCreator('/docs-dev-mode/docs/requirements/system-block-diagram', '876'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/requirements/system-overview',
                component: ComponentCreator('/docs-dev-mode/docs/requirements/system-overview', '317'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/requirements/use-case-descriptions',
                component: ComponentCreator('/docs-dev-mode/docs/requirements/use-case-descriptions', '1cd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/architecture-diagrams',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/architecture-diagrams', '78c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/components',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/components', 'ac5'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/database-diagram',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/database-diagram', '1a2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/development-environment',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/development-environment', '2f2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/Sequence Diagrams',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/Sequence Diagrams', '1da'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/system-architecture/version-control',
                component: ComponentCreator('/docs-dev-mode/docs/system-architecture/version-control', '99b'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/testing/acceptence-testing',
                component: ComponentCreator('/docs-dev-mode/docs/testing/acceptence-testing', '933'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/testing/integration-testing',
                component: ComponentCreator('/docs-dev-mode/docs/testing/integration-testing', 'b74'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/docs/testing/unit-testing',
                component: ComponentCreator('/docs-dev-mode/docs/testing/unit-testing', 'f77'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/docs-dev-mode/tutorial',
    component: ComponentCreator('/docs-dev-mode/tutorial', '80b'),
    routes: [
      {
        path: '/docs-dev-mode/tutorial',
        component: ComponentCreator('/docs-dev-mode/tutorial', 'ca3'),
        routes: [
          {
            path: '/docs-dev-mode/tutorial',
            component: ComponentCreator('/docs-dev-mode/tutorial', 'c62'),
            routes: [
              {
                path: '/docs-dev-mode/tutorial/category/custom-components',
                component: ComponentCreator('/docs-dev-mode/tutorial/category/custom-components', 'e50'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/category/tutorial---basics',
                component: ComponentCreator('/docs-dev-mode/tutorial/category/tutorial---basics', 'b67'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/category/tutorial---extras',
                component: ComponentCreator('/docs-dev-mode/tutorial/category/tutorial---extras', '868'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/custom-components/contributors',
                component: ComponentCreator('/docs-dev-mode/tutorial/custom-components/contributors', '8fd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/custom-components/figure',
                component: ComponentCreator('/docs-dev-mode/tutorial/custom-components/figure', '1d2'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/custom-components/inline-docs',
                component: ComponentCreator('/docs-dev-mode/tutorial/custom-components/inline-docs', '554'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/intro',
                component: ComponentCreator('/docs-dev-mode/tutorial/intro', '63f'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/open-source-usage',
                component: ComponentCreator('/docs-dev-mode/tutorial/open-source-usage', 'bbc'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/congratulations',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/congratulations', '0fd'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/create-a-document',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/create-a-document', '91c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/create-a-page',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/create-a-page', '84e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/deploy-your-site',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/deploy-your-site', 'f0d'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/markdown-features',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/markdown-features', '66e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/mermaid',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/mermaid', '335'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-basics/set-environment-variables',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-basics/set-environment-variables', '1ac'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-extras/manage-docs-versions',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-extras/manage-docs-versions', 'b22'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs-dev-mode/tutorial/tutorial-extras/translate-your-site',
                component: ComponentCreator('/docs-dev-mode/tutorial/tutorial-extras/translate-your-site', '86b'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/docs-dev-mode/',
    component: ComponentCreator('/docs-dev-mode/', '5c1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
