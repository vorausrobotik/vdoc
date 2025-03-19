export const testIDs = {
  header: {
    main: 'header',
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
    projectCard: {
      main: 'landingPage.projectCard',
      title: 'landingPage.projectCard.title',
      actions: {
        main: 'landingPage.projectCard.actions',
        documentationLink: 'landingPage.projectCard.actions.openDocumentation',
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
