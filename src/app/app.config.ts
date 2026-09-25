import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { inject } from '@angular/core';
import { InMemoryCache, ApolloLink, split } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { isSubscriptionOperation } from '@apollo/client/utilities';
import { environment } from '../environments/environment';

import { routes } from './app.routes';
import { AUTH_REPOSITORY } from '@features/auth/domain/ports/auth.repository';
import { AuthHttpService } from '@features/auth/data-access/api/auth-http.service';
import { USER_REPOSITORY } from '@features/users/domain/ports/user.repository';
import { UserGraphqlService } from '@features/users/data-access/api/user-graphql.service';
import { RECRUITER_PROFILE_REPOSITORY } from '@features/recruiter/pages/profile/domain/ports/recruiter-profile.repository';
import { RecruiterProfileGraphqlService } from '@features/recruiter/pages/profile/data-access/api/recruiter-profile-graphql.service';
import { DEVELOPER_PROFILE_REPOSITORY } from '@features/developer/profile/domain/ports/developer-profile.repository';
import { DeveloperProfileGraphqlService } from '@features/developer/profile/data-access/api/developer-profile-graphql.service';
import { COMMENT_REPOSITORY } from '@features/shared/domain/ports/comment.repository';
import { CommentGraphqlService } from '@features/shared/data-access/api/comment-graphql.service';
import { REACTION_REPOSITORY } from '@features/shared/domain/ports/reaction.repository';
import { ReactionGraphqlService } from '@features/shared/data-access/api/reaction-graphql.service';
import { FOLLOW_REPOSITORY } from '@features/shared/domain/ports/follow.repository';
import { FollowGraphqlService } from '@features/shared/data-access/api/follow-graphql.service';
import { CONNECTION_REPOSITORY } from '@features/shared/domain/ports/connection.repository';
import { ConnectionGraphqlService } from '@features/shared/data-access/api/connection-graphql.service';
import { POST_REPOSITORY } from '@features/recruiter/pages/inicio/domain/ports/post.repository';
import { PostGraphqlService } from '@features/recruiter/pages/inicio/data-access/api/post-graphql.service';
import { STORY_REPOSITORY } from '@features/recruiter/pages/inicio/domain/ports/story.repository';
import { StoryGraphqlService } from '@features/recruiter/pages/inicio/data-access/api/story-graphql.service';
import { MUSICA_REPOSITORY } from '@features/recruiter/pages/inicio/domain/ports/musica.repository';
import { MusicaHttpService } from '@features/recruiter/pages/inicio/data-access/api/musica-http.service';
import { REEL_REPOSITORY } from '@features/recruiter/pages/reels/domain/ports/reel.repository';
import { ReelGraphqlService } from '@features/recruiter/pages/reels/data-access/api/reel-graphql.service';
import { NOTIFICATION_REPOSITORY } from '@features/shared/domain/ports/notification.repository';
import { NotificationGraphqlService } from '@features/shared/data-access/api/notification-graphql.service';
import { BLOCK_REPOSITORY } from '@features/shared/domain/ports/block.repository';
import { BlockGraphqlService } from '@features/shared/data-access/api/block-graphql.service';
import { TALENT_SEARCH_REPOSITORY } from '@features/recruiter/pages/candidates/domain/ports/talent-search.repository';
import { TalentSearchService } from '@features/recruiter/pages/candidates/data-access/api/talent-search.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AUTH_REPOSITORY, useClass: AuthHttpService },
    { provide: USER_REPOSITORY, useClass: UserGraphqlService },
    { provide: RECRUITER_PROFILE_REPOSITORY, useClass: RecruiterProfileGraphqlService },
    { provide: DEVELOPER_PROFILE_REPOSITORY, useClass: DeveloperProfileGraphqlService },
    { provide: COMMENT_REPOSITORY, useClass: CommentGraphqlService },
    { provide: REACTION_REPOSITORY, useClass: ReactionGraphqlService },
    { provide: FOLLOW_REPOSITORY, useClass: FollowGraphqlService },
    { provide: CONNECTION_REPOSITORY, useClass: ConnectionGraphqlService },
    { provide: POST_REPOSITORY, useClass: PostGraphqlService },
    { provide: STORY_REPOSITORY, useClass: StoryGraphqlService },
    { provide: MUSICA_REPOSITORY, useClass: MusicaHttpService },
    { provide: REEL_REPOSITORY, useClass: ReelGraphqlService },
    { provide: NOTIFICATION_REPOSITORY, useClass: NotificationGraphqlService },
    { provide: BLOCK_REPOSITORY, useClass: BlockGraphqlService },
    { provide: TALENT_SEARCH_REPOSITORY, useClass: TalentSearchService },
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

      const http = ApolloLink.from([auth, httpLink.create({ uri: `${environment.apiUrl}/graphql` })]);

      const wsUrl = `${environment.apiUrl.replace(/^http/, 'ws')}/graphql`;
      const ws = new GraphQLWsLink(
        createClient({
          url: wsUrl,
          connectionParams: () => {
            const token = localStorage.getItem('token');
            return token ? { Authorization: `Bearer ${token}` } : {};
          },
        }),
      );

      const link = split(
        ({ query }) => isSubscriptionOperation(query),
        ws,
        http,
      );

      return {
        link,
        cache: new InMemoryCache(),
      };
    }),
  ]
};
