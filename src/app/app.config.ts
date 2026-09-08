import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { inject } from '@angular/core';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
    })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideApollo(() => {
      const httpLink = inject(HttpLink);

      const auth = setContext((_, { headers }) => {
        const token = localStorage.getItem('token');
        return {
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : '',
          },
        };
      });

      return {
        link: ApolloLink.from([auth, httpLink.create({ uri: 'http://localhost:3000/graphql' })]),
        cache: new InMemoryCache(),
      };
    }),
  ]
};
