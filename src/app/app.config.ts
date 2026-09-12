import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { inject } from '@angular/core';
import { InMemoryCache, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { AUTH_REPOSITORY } from './features/auth/domain/ports/auth.repository';
import { AuthHttpService } from './features/auth/data-access/api/auth-http.service';
import { USER_REPOSITORY } from './features/users/domain/ports/user.repository';
import { UserGraphqlService } from './features/users/data-access/api/user-graphql.service';
import { RECRUITER_PROFILE_REPOSITORY } from './features/recruiter/profile/domain/ports/recruiter-profile.repository';
import { RecruiterProfileGraphqlService } from './features/recruiter/profile/data-access/api/recruiter-profile-graphql.service';
import { DEVELOPER_PROFILE_REPOSITORY } from './features/developer/profile/domain/ports/developer-profile.repository';
import { DeveloperProfileGraphqlService } from './features/developer/profile/data-access/api/developer-profile-graphql.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AUTH_REPOSITORY, useClass: AuthHttpService },
    { provide: USER_REPOSITORY, useClass: UserGraphqlService },
    { provide: RECRUITER_PROFILE_REPOSITORY, useClass: RecruiterProfileGraphqlService },
    { provide: DEVELOPER_PROFILE_REPOSITORY, useClass: DeveloperProfileGraphqlService },
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
        link: ApolloLink.from([auth, httpLink.create({ uri: `${environment.apiUrl}/graphql` })]),
        cache: new InMemoryCache(),
      };
    }),
  ]
};
