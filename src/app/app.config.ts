import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { provideApollo } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { inject } from '@angular/core';
import { InMemoryCache, ApolloLink, split } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { isSubscriptionOperation } from '@apollo/client/utilities';
import { from, switchMap, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { TokenRefreshService } from '@core/services/token-refresh.service';

import { routes } from './app.routes';
import { AUTH_REPOSITORY } from '@features/auth/domain/ports/auth.repository';
import { AuthHttpService } from '@features/auth/data-access/api/auth-http.service';
import { USER_REPOSITORY } from '@features/users/domain/ports/user.repository';
import { UserGraphqlService } from '@features/users/data-access/api/user-graphql.service';
import { RECRUITER_PROFILE_REPOSITORY } from '@features/recruiter/pages/profile/domain/ports/recruiter-profile.repository';
import { RecruiterProfileGraphqlService } from '@features/recruiter/pages/profile/data-access/api/recruiter-profile-graphql.service';
import { CATEGORY_REPOSITORY } from '@features/recruiter/pages/profile/domain/ports/category.repository';
import { CategoryGraphqlService } from '@features/recruiter/pages/profile/data-access/api/category-graphql.service';
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
import { VACANCY_REPOSITORY } from '@features/recruiter/pages/offers/domain/ports/vacancy.repository';
import { VacancyGraphqlService } from '@features/recruiter/pages/offers/data-access/api/vacancy-graphql.service';
import { COMPANY_REPOSITORY } from '@features/recruiter/pages/company/domain/ports/company.repository';
import { CompanyGraphqlService } from '@features/recruiter/pages/company/data-access/api/company-graphql.service';
import { MESSAGE_REPOSITORY } from '@features/shared/domain/ports/message.repository';
import { MessageGraphqlService } from '@features/shared/data-access/api/message-graphql.service';
import { APPLICATION_REPOSITORY } from '@features/developer/postulaciones/domain/ports/application.repository';
import { ApplicationGraphqlService } from '@features/developer/postulaciones/data-access/api/application-graphql.service';
import { VACANCY_DETAIL_REPOSITORY } from '@features/developer/postulaciones/domain/ports/vacancy-detail.repository';
import { VacancyDetailGraphqlService } from '@features/developer/postulaciones/data-access/api/vacancy-detail-graphql.service';
import { POINTS_REPOSITORY } from '@features/developer/gamificacion/domain/ports/points.repository';
import { PointsGraphqlService } from '@features/developer/gamificacion/data-access/api/points-graphql.service';
import { ECODEV_REPOSITORY } from '@features/developer/ecodev/domain/ports/ecodev.repository';
import { EcotechGraphqlService } from '@features/developer/ecodev/data-access/api/ecotech-graphql.service';
import { CHALLENGE_REPOSITORY } from '@features/developer/retos/domain/ports/challenge.repository';
import { ChallengeGraphqlService } from '@features/developer/retos/data-access/api/challenge-graphql.service';
import { QUESTION_REPOSITORY } from '@features/developer/qa/domain/ports/question.repository';
import { QuestionGraphqlService } from '@features/developer/qa/data-access/api/question-graphql.service';
import { REPORT_REPOSITORY } from '@features/moderator/feature/reports/domain/ports/report.repository';
import { ReportHttpService } from '@features/moderator/feature/reports/data-access/api/report-http.service';
import { USER_MODERATION_REPOSITORY } from '@features/users/domain/ports/user-moderation.repository';
import { UserModerationHttpService } from '@features/users/data-access/api/user-moderation-http.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AUTH_REPOSITORY, useClass: AuthHttpService },
    { provide: USER_REPOSITORY, useClass: UserGraphqlService },
    { provide: RECRUITER_PROFILE_REPOSITORY, useClass: RecruiterProfileGraphqlService },
    { provide: CATEGORY_REPOSITORY, useClass: CategoryGraphqlService },
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
    { provide: VACANCY_REPOSITORY, useClass: VacancyGraphqlService },
    { provide: COMPANY_REPOSITORY, useClass: CompanyGraphqlService },
    { provide: MESSAGE_REPOSITORY, useClass: MessageGraphqlService },
    { provide: APPLICATION_REPOSITORY, useClass: ApplicationGraphqlService },
    { provide: VACANCY_DETAIL_REPOSITORY, useClass: VacancyDetailGraphqlService },
    { provide: POINTS_REPOSITORY, useClass: PointsGraphqlService },
    { provide: ECODEV_REPOSITORY, useClass: EcotechGraphqlService },
    { provide: CHALLENGE_REPOSITORY, useClass: ChallengeGraphqlService },
    { provide: QUESTION_REPOSITORY, useClass: QuestionGraphqlService },
    { provide: REPORT_REPOSITORY, useClass: ReportHttpService },
    { provide: USER_MODERATION_REPOSITORY, useClass: UserModerationHttpService },
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
    })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideApollo(() => {
      const httpLink = inject(HttpLink);
      const session = inject(TokenRefreshService);

      const auth = setContext((_, { headers }) => {
        const token = localStorage.getItem('token');
        return {
          headers: {
            ...headers,
            Authorization: token ? `Bearer ${token}` : '',
          },
        };
      });

      // Apollo no pasa por el interceptor de HttpClient: el 401 se atiende aquí.
      // Va ANTES de `auth` para que el reintento vuelva a leer el token ya
      // renovado; un solo reintento por operación (authRetried).
      const authRetry = new ErrorLink(({ error, operation, forward }) => {
        if (!isUnauthorized(error)) return;
        if (operation.getContext()['authRetried']) return;

        return from(session.refresh()).pipe(
          switchMap((newToken) => {
            if (!newToken) return throwError(() => error);
            const headers = operation.getContext()['headers'] ?? {};
            operation.setContext({
              authRetried: true,
              headers: { ...headers, Authorization: `Bearer ${newToken}` },
            });
            return forward(operation);
          }),
        );
      });

      const http = ApolloLink.from([
        authRetry,
        auth,
        httpLink.create({ uri: `${environment.apiUrl}/graphql` }),
      ]);

      const wsUrl = `${environment.apiUrl.replace(/^http/, 'ws')}/graphql`;
      const ws = new GraphQLWsLink(
        createClient({
          url: wsUrl,
          // Se invoca en cada intento de conexión: al reconectar toma el
          // access token que quedó guardado tras un refresh.
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

/**
 * ¿El error es un 401 del filtro JWT? Cubre el `ServerError` de Apollo
 * (status HTTP distinto de 200) y el cuerpo `{"message":"Token invalido o
 * expirado"}` si llegara como error GraphQL.
 */
function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as {
    statusCode?: number;
    status?: number;
    message?: string;
    errors?: Array<{ message?: string }>;
  };
  if (err.statusCode === 401 || err.status === 401) return true;

  const mensajes = [
    err.message,
    ...(Array.isArray(err.errors) ? err.errors.map((e) => e?.message) : []),
  ];
  return mensajes.some((m) => !!m && /token invalido o expirado/i.test(m));
}
