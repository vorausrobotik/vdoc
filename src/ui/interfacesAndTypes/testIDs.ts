export const testIDs = {
  header: {
    main: 'header',
    logo: {
      main: 'header.logo',
      image: 'header.logo.image',
      text: 'header.logo.text',
    },
    versionDropdown: {
      main: 'header.versionDropdown',
      item: 'header.versionDropdown.item',
      emptyItem: 'header.versionDropdown.emptyItem',
      showAllItem: 'header.versionDropdown.moreItem',
    },
    settingsButton: 'header.settingsButton',
  },
  sidebar: {
    main: 'sidebar',
    close: 'sidebar.close',
    settings: {
      toggleColorModes: {
        main: 'sidebar.settings.toggleColorModes',
        buttons: {
          light: 'sidebar.settings.toggleColorModes.buttons.light',
          system: 'sidebar.settings.toggleColorModes.buttons.system',
          dark: 'sidebar.settings.toggleColorModes.buttons.dark',
        },
      },
    },
  },
  loadingIndicator: {
    main: 'loadingIndicator',
  },
  landingPage: {
    main: 'landingPage',
    projectCategories: {
      main: 'landingPage.projectCategories',
      projectCategory: {
        main: 'landingPage.projectCategories.projectCategory',
        title: 'landingPage.projectCategories.projectCategory.title',
        projects: {
          main: 'landingPage.projectCategories.projectCategory.projects',
          projectCard: {
            main: 'landingPage.projectCategories.projectCategory.projects.projectCard',
            title: 'landingPage.projectCategories.projectCategory.projects.projectCard.title',
            actions: {
              main: 'landingPage.projectCategories.projectCategory.projects.projectCard.actions',
              documentationLink:
                'landingPage.projectCategories.projectCategory.projects.projectCard.actions.openDocumentation',
            },
          },
        },
      },
    },
  },
  project: {
    versionOverview: {
      main: 'project.versionOverview',
      majorVersionCard: {
        main: 'project.versionOverview.majorVersionCard',
        versionItem: {
          main: 'project.versionOverview.majorVersionCard.versionItem',
        },
      },
    },
    documentation: {
      main: 'project.documentation',
      latestVersionWarningBanner: 'project.documentation.latestVersionWarningBanner',
      documentationIframe: 'project.documentation.documentationIframe',
    },
  },
  errorComponent: {
    main: 'errorComponent',
    icon: 'errorComponent.icon',
    title: 'errorComponent.title',
    description: 'errorComponent.description',
    actionButton: 'errorComponent.actionButton',
  },
} as const

export default testIDs
