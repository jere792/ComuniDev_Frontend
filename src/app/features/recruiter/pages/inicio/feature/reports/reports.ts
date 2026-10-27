import { Component, OnInit, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { PostStore } from '@features/recruiter/pages/inicio/data-access/state/post.store';
import { CommentStore } from '@features/shared/data-access/state/comment.store';
import { ReactionStore } from '@features/shared/data-access/state/reaction.store';
import { SocialPost } from '@features/recruiter/pages/inicio/domain/models/social-post.model';
import { SocialComment } from '@features/shared/domain/models/social-comment.model';
import { TipoReaccion } from '@features/shared/domain/models/social-reaction.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { FeedSkeletonComponent } from '@shared/ui/feed-skeleton/feed-skeleton';
import { ToastService } from '@core/services/toast.service';
import { ImageEditorService } from '@core/services/image-editor.service';
import { ConfirmModal } from '@shared/ui/confirm-modal/confirm-modal';
import { VacancyGraphqlService } from '@features/recruiter/pages/offers/data-access/api/vacancy-graphql.service';
import { OfferItem } from '@features/recruiter/pages/offers/domain/models/vacancy.model';
import { VacanteEmbebida } from '@features/recruiter/pages/inicio/domain/models/social-post.model';

interface CommentVM {
  comment: SocialComment;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  replies: CommentVM[];
  repliesCount: number;
  repliesLoaded: boolean;
  showReplies: boolean;
  showReplyInput: boolean;
  replyText: string;
  showReactionDropdown: boolean;
}

interface PostVM {
  post: SocialPost;
  autorNombre: string;
  autorAvatar: string;
  myReaction: TipoReaccion | null;
  showComments: boolean;
  comments: CommentVM[];
  visibleComments: number;
  newComment: string;
  isEditing: boolean;
  editText: string;
  showReactionsDropdown: boolean;
}

const REACTION_CONFIG: Record<TipoReaccion, { icon: string; label: string; color: string; emoji: string }> = {
  LIKE: { icon: 'thumb_up', label: 'Me gusta', color: '#1877F2', emoji: '👍' },
  LOVE: { icon: 'favorite', label: 'Me encanta', color: '#F33E58', emoji: '❤️' },
  CELEBRATE: { icon: 'celebration', label: 'Celebrar', color: '#F7B928', emoji: '🎉' },
  SUPPORT: { icon: 'volunteer_activism', label: 'Apoyar', color: '#44B37D', emoji: '💪' },
};

@Component({
  selector: 'app-reports',
  imports: [FormsModule, DatePipe, NgTemplateOutlet, FeedSkeletonComponent, ConfirmModal],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsComponent implements OnInit {
  private postService = inject(PostStore);
  private commentService = inject(CommentStore);
  private reactionService = inject(ReactionStore);
  private userStore = inject(UserStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  private imageEditor = inject(ImageEditorService);
  private vacancyService = inject(VacancyGraphqlService);

  posts = signal<PostVM[]>([]);
  composerText = '';
  composerImage: string | null = null;
  uploadingImage = false;
  /** Oferta elegida para publicarla en el feed con su tarjeta. */
  composerVacante: { id: string; titulo: string; empresa: string; modalidad: string; ubicacion: string; tecnologias: string[] } | null = null;
  showVacantePicker = signal(false);
  misVacantes = signal<OfferItem[]>([]);
  loading = signal(true);
  showComposerModal = signal(false);
  showCommentsModal = signal(false);
  modalPostId = signal<string>('');
  modalNewComment = '';
  modalComments = computed<CommentVM[]>(() => {
    const id = this.modalPostId();
    if (!id) return [];
    return this.posts().find(v => v.post.id === id)?.comments ?? [];
  });
  modalCommentCount = computed<number>(() => {
    const id = this.modalPostId();
    if (!id) return 0;
    return this.posts().find(v => v.post.id === id)?.post.estadisticas?.comentariosCount ?? 0;
  });
  deleteConfirmOpen = signal(false);
  pendingDeleteId = signal<string | null>(null);

  reactionTypes: TipoReaccion[] = ['LIKE', 'LOVE', 'CELEBRATE', 'SUPPORT'];
  reactionConfig = REACTION_CONFIG;

  private userCache = new Map<string, { nombre: string; avatar: string }>();

  private getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUserIdPublic(): string | null {
    return this.getUserId();
  }

  ngOnInit(): void {
    const userId = this.getUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    //solo las vacantes activas propias se pueden destacar en el feed
    this.vacancyService.vacanciesByRecruiter(userId).subscribe({
      next: (lista) => this.misVacantes.set(lista.filter(v => (v.estado ?? '').toUpperCase() === 'ACTIVA')),
      error: () => this.misVacantes.set([])
    });

    this.postService.getFeed(userId, 0, 20).subscribe({
      next: (data: SocialPost[]) => {
        this.posts.set(data.map(p => this.buildVm(p)));
        this.loading.set(false);
        this.cargarAutores(data.map(p => p.autorId));
        this.loadMyReactions(data);
        // contadores y comentarios de TODOS los posts en 2 peticiones (antes: 20 + 20)
        this.cargarConteosComentarios(data);
        this.cargarTodosLosComentarios(data);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private buildVm(post: SocialPost): PostVM {
    return {
      post,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      showComments: true,
      comments: [],
      visibleComments: 3,
      newComment: '',
      isEditing: false,
      editText: '',
      showReactionsDropdown: false,
    };
  }

  private buildCommentVm(comment: SocialComment): CommentVM {
    return {
      comment,
      autorNombre: '',
      autorAvatar: '',
      myReaction: null,
      replies: [],
      repliesCount: comment.repliesCount ?? 0,
      repliesLoaded: false,
      showReplies: false,
      showReplyInput: false,
      replyText: '',
      showReactionDropdown: false,
    };
  }

  /** Autores del feed en UNA sola peticion (aliases u0, u1...); el cache evita repetir. */
  private cargarAutores(autorIds: string[]): void {
    const pedidos = [...new Set(autorIds)].filter(id => !!id);
    const faltantes = pedidos.filter(id => !this.userCache.has(id));

    const aplicar = () => pedidos.forEach(id => {
      const info = this.userCache.get(id);
      if (info) this.applyAuthor(id, info);
    });

    if (faltantes.length === 0) {
      aplicar();
      return;
    }

    this.userStore.getByIds(faltantes).subscribe({
      next: (usuarios: any[]) => {
        usuarios.forEach(u => {
          if (u?.id) this.userCache.set(u.id, { nombre: u.nombre ?? 'Usuario', avatar: u.fotoPerfilUrl ?? '' });
        });
        aplicar();
      },
      error: () => {}
    });
  }

  private applyAuthor(autorId: string, info: { nombre: string; avatar: string }): void {
    this.posts.update(list => list.map(vm => {
      if (vm.post.autorId === autorId) {
        return { ...vm, autorNombre: info.nombre, autorAvatar: info.avatar };
      }
      return vm;
    }));
  }

  private loadMyReactions(feed: SocialPost[]): void {
    const userId = this.getUserId();
    if (!userId || feed.length === 0) return;

    // UNA sola peticion para todo el feed (antes: una por post)
    this.reactionService.getMyReactions(userId, 'POST', feed.map(p => p.id)).subscribe({
      next: (reacciones) => {
        const tipoDe = new Map(reacciones.map(r => [r.objetivoId, r.tipoReaccion as TipoReaccion]));
        this.posts.update(list => list.map(vm => {
          const tipo = tipoDe.get(vm.post.id);
          return tipo ? { ...vm, myReaction: tipo } : vm;
        }));
      },
      error: () => {}
    });
  }

  // ─── Composer ───

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const edited = await this.imageEditor.open(file, {
      aspect: null,
      aspectOptions: [
        { label: 'Libre', value: null },
        { label: '1:1', value: 1 },
        { label: '4:5', value: 4 / 5 },
        { label: '16:9', value: 16 / 9 },
      ],
      maxSide: 1600,
      title: 'Editar imagen del post',
      quality: 0.85,
    });
    if (!edited) return;

    this.uploadingImage = true;
    this.userStore.uploadFile(edited).subscribe({
      next: (res: any) => {
        this.composerImage = res?.secure_url ?? res?.url ?? null;
        this.uploadingImage = false;
        this.toast.success('Imagen lista para publicar');
      },
      error: () => {
        this.uploadingImage = false;
        this.toast.error('Error al subir imagen');
      }
    });
  }

  removeImage(): void {
    this.composerImage = null;
  }

  /** Abre/cierra la lista de vacantes propias para destacarlas en la publicación. */
  toggleVacantePicker(): void {
    this.showVacantePicker.update(v => !v);
  }

  elegirVacante(v: OfferItem): void {
    this.composerVacante = {
      id: v.id,
      titulo: v.titulo,
      empresa: v.company?.nombre ?? '',
      modalidad: v.modalidad ?? '',
      ubicacion: v.ubicacion ?? '',
      tecnologias: v.tecnologias ?? [],
    };
    this.showVacantePicker.set(false);
  }

  quitarVacante(): void {
    this.composerVacante = null;
  }

  /** Quién figura en la tarjeta: la empresa si existe, si no el reclutador que publicó. */
  empresaMostrada(v: VacanteEmbebida): string {
    return v.company?.nombre?.trim() || v.recruiter?.nombre?.trim() || '';
  }

  /** «Empresa · modalidad · ubicación», sin separadores sueltos cuando falta algún dato. */
  detalleVacante(v: VacanteEmbebida): string {
    return [this.empresaMostrada(v), v.modalidad ?? '', v.ubicacion ?? '']
      .map(parte => parte.trim())
      .filter(Boolean)
      .join(' · ');
  }

  inicialesEmpresa(v: VacanteEmbebida): string {
    const nombre = this.empresaMostrada(v) || v.titulo?.trim() || '';
    const iniciales = nombre.split(/\s+/).slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
    return iniciales || 'CV';
  }

  diasRestantes(v: VacanteEmbebida): number {
    if (!v.fechaLimite) return 0;
    const limite = new Date(v.fechaLimite).getTime();
    if (Number.isNaN(limite)) return 0;
    const dias = Math.ceil((limite - Date.now()) / 86400000);
    return dias > 0 ? dias : 0;
  }

  /** La oferta publicada se administra desde la lista de Ofertas. */
  verOferta(): void {
    this.router.navigate(['/recruiter/offers']);
  }

  publish(): void {
    const userId = this.getUserId();
    const text = this.composerText.trim();
    const vacante = this.composerVacante;
    //con la vacante elegida basta la tarjeta: no hace falta escribir texto
    if (!userId || (!text && !this.composerImage && !vacante)) return;

    const contenido: any = { texto: text || undefined };
    if (this.composerImage) contenido.imagenes = [this.composerImage];

    this.postService
      .createPost(userId, contenido, undefined, undefined, undefined, vacante ? 'VACANTE' : undefined, vacante?.id)
      .subscribe({
        next: (created: SocialPost) => {
          if (created) {
            this.posts.update(list => [this.buildVm(created), ...list]);
            this.cargarAutores([created.autorId]);
            this.composerText = '';
            this.composerImage = null;
            this.composerVacante = null;
            this.showComposerModal.set(false);
            this.toast.success(vacante ? 'Oferta publicada en el feed' : 'Publicación creada');
          }
        },
        error: () => this.toast.error('Error al crear publicación')
      });
  }

  closeComposerModal(): void {
    this.showComposerModal.set(false);
    this.composerText = '';
    this.composerImage = null;
    this.composerVacante = null;
    this.showVacantePicker.set(false);
  }

  // ─── Post Reacciones ───

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeAllDropdowns();
  }

  private closeAllDropdowns(): void {
    const anyOpen = this.posts().some(v => v.showReactionsDropdown || this.hasOpenCommentDropdown(v.comments));
    if (!anyOpen) return;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: false,
      comments: this.closeCommentDropdowns(v.comments),
    })));
  }

  private hasOpenCommentDropdown(comments: CommentVM[]): boolean {
    return comments.some(c => c.showReactionDropdown || this.hasOpenCommentDropdown(c.replies));
  }

  private closeCommentDropdowns(comments: CommentVM[]): CommentVM[] {
    return comments.map(c => ({
      ...c,
      showReactionDropdown: false,
      replies: this.closeCommentDropdowns(c.replies),
    }));
  }

  private setCommentDropdown(comments: CommentVM[], targetId: string, willOpen: boolean): CommentVM[] {
    return comments.map(c => ({
      ...c,
      showReactionDropdown: c.comment.id === targetId ? willOpen : false,
      replies: this.setCommentDropdown(c.replies, targetId, willOpen),
    }));
  }

  toggleReactionsDropdown(vm: PostVM): void {
    const willOpen = !vm.showReactionsDropdown;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: v.post.id === vm.post.id ? willOpen : false,
      comments: this.closeCommentDropdowns(v.comments),
    })));
  }

  selectReaction(vm: PostVM, type: TipoReaccion): void {
    this.toggleReaction(vm, type);
    this.closeAllDropdowns();
  }

  toggleReaction(vm: PostVM, type: TipoReaccion): void {
    const userId = this.getUserId();
    if (!userId) return;

    const currentCount = vm.post.estadisticas?.reaccionesCount ?? 0;

    if (vm.myReaction === type) {
      this.reactionService.unreact(userId, vm.post.id, 'POST').subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            myReaction: null,
            post: { ...v.post, estadisticas: { ...v.post.estadisticas, reaccionesCount: Math.max(0, currentCount - 1) } }
          } : v));
        },
        error: (err) => console.error('Failed to unreact:', err)
      });
    } else if (vm.myReaction) {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, myReaction: type } : v));
        },
        error: (err) => console.error('Failed to react:', err)
      });
    } else {
      this.reactionService.react(userId, vm.post.id, 'POST', type).subscribe({
        next: () => {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            myReaction: type,
            post: { ...v.post, estadisticas: { ...v.post.estadisticas, reaccionesCount: currentCount + 1 } }
          } : v));
        },
        error: (err) => console.error('Failed to react:', err)
      });
    }
  }

  /** Lista de quienes reaccionaron a un post: se abre con un clic en el contador. */
  readonly reaccionesAbierta = signal(false);
  readonly cargandoReacciones = signal(false);
  readonly reaccionadores = signal<Array<{ id: string; nombre: string; avatar: string; tipo: TipoReaccion }>>([]);

  verReacciones(vm: PostVM): void {
    this.abrirReacciones(vm.post.id, 'POST');
  }

  /** Lo mismo para comentarios y respuestas: quienes reaccionaron a ese comentario. */
  verReaccionesComentario(cvm: CommentVM): void {
    this.abrirReacciones(cvm.comment.id, 'COMMENT');
  }

  private abrirReacciones(targetId: string, targetType: string): void {
    this.reaccionesAbierta.set(true);
    this.reaccionadores.set([]);
    this.cargandoReacciones.set(true);

    this.reactionService.getReactions(targetId, targetType).subscribe({
      next: (reacciones) => {
        const ids = [...new Set(reacciones.map(r => r.usuarioId).filter((id): id is string => Boolean(id)))];
        if (ids.length === 0) {
          this.cargandoReacciones.set(false);
          return;
        }
        const tipoDe = new Map(reacciones.map(r => [r.usuarioId, r.tipoReaccion as TipoReaccion]));

        // todas las personas de la lista en UNA peticion (aliases u0, u1...)
        this.userStore.getByIds(ids).subscribe({
          next: (usuarios: any[]) => {
            this.reaccionadores.set(usuarios
              .filter(u => u?.id)
              .map(u => ({
                id: u.id,
                nombre: u.nombre || 'Usuario',
                avatar: u.fotoPerfilUrl || '',
                tipo: tipoDe.get(u.id) ?? 'LIKE',
              })));
            this.cargandoReacciones.set(false);
          },
          error: () => this.cargandoReacciones.set(false),
        });
      },
      error: () => this.cargandoReacciones.set(false),
    });
  }

  cerrarReacciones(): void {
    this.reaccionesAbierta.set(false);
  }

  getReactionEmoji(vm: PostVM): string {
    return vm.myReaction ? this.reactionConfig[vm.myReaction].emoji : '😊';
  }

  getReactionLabel(vm: PostVM): string {
    return vm.myReaction ? this.reactionConfig[vm.myReaction].label : 'Reacciones';
  }

  // ─── Comentarios ───

  toggleComments(vm: PostVM): void {
    const newShow = !vm.showComments;
    this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, showComments: newShow } : v));
    if (newShow && vm.comments.length === 0) {
      this.loadComments(vm);
    }
  }

  private loadComments(vm: PostVM): void {
    this.commentService.getComments(vm.post.id, 'POST').subscribe({
      next: (comments: SocialComment[]) => {
        const vms = comments.map(c => this.buildCommentVm(c));
        this.posts.update(list => list.map(v => {
          if (v.post.id === vm.post.id) {
            return { ...v, comments: vms };
          }
          return v;
        }));
        // autores y mis reacciones de los comentarios en 2 peticiones (antes: 1 por comentario)
        this.cargarAutoresComentarios(comments.map(c => c.autorId), vm.post.id);
        this.cargarMisReaccionesComentarios(comments.map(c => c.id), vm.post.id);
      },
      error: (err) => console.error('Failed to load comments:', err)
    });
  }

  private bumpCommentCount(postId: string, delta: number): void {
    this.posts.update(list => list.map(v => v.post.id === postId ? {
      ...v,
      post: {
        ...v.post,
        estadisticas: {
          ...v.post.estadisticas,
          comentariosCount: Math.max(0, (v.post.estadisticas?.comentariosCount ?? 0) + delta),
        },
      },
    } : v));
  }

  private setCommentCount(postId: string, count: number): void {
    this.posts.update(list => list.map(v => v.post.id === postId ? {
      ...v,
      post: { ...v.post, estadisticas: { ...v.post.estadisticas, comentariosCount: count } },
    } : v));
  }

  private loadCommentCountSilently(post: SocialPost): void {
    this.commentService.countComments(post.id, 'POST').subscribe({
      next: (count: number) => this.setCommentCount(post.id, count),
      error: () => {}
    });
  }

  /** Contadores de todos los posts en UNA peticion (antes: una por post). */
  private cargarConteosComentarios(posts: SocialPost[]): void {
    if (posts.length === 0) return;
    this.commentService.countCommentsBatch(posts.map(p => p.id), 'POST').subscribe({
      next: (contados) => contados.forEach(c => this.setCommentCount(c.contentId, c.count)),
      // si el batch falla (backend sin actualizar), se hace como antes
      error: () => posts.forEach(p => this.loadCommentCountSilently(p)),
    });
  }

  /** Comentarios de todos los posts en UNA peticion (antes: una por post). */
  private cargarTodosLosComentarios(posts: SocialPost[]): void {
    if (posts.length === 0) return;

    this.commentService.getCommentsBatch(posts.map(p => p.id), 'POST').subscribe({
      next: (comentarios: SocialComment[]) => {
        const porContenido = new Map<string, SocialComment[]>();
        comentarios.forEach(c => {
          const lista = porContenido.get(c.contenidoId) ?? [];
          lista.push(c);
          porContenido.set(c.contenidoId, lista);
        });

        porContenido.forEach((lista, postId) => {
          this.posts.update(list => list.map(v =>
            v.post.id === postId ? { ...v, comments: lista.map(c => this.buildCommentVm(c)) } : v
          ));
        });

        // autores y mis reacciones de esos comentarios, en 2 peticiones por post
        this.posts()
          .filter(v => porContenido.has(v.post.id) && v.comments.length > 0)
          .forEach(v => {
            this.cargarAutoresComentarios(v.comments.map(c => c.comment.autorId), v.post.id);
            this.cargarMisReaccionesComentarios(v.comments.map(c => c.comment.id), v.post.id);
          });
      },
      // si el batch falla (backend sin actualizar), se hace como antes
      error: () => this.posts()
        .filter(v => posts.some(p => p.id === v.post.id))
        .forEach(v => this.loadComments(v)),
    });
  }

  private mapComments(comments: CommentVM[], fn: (cvm: CommentVM) => CommentVM): CommentVM[] {
    return comments.map(cvm => {
      const mapped = fn(cvm);
      if (mapped.replies.length > 0) {
        return { ...mapped, replies: this.mapComments(mapped.replies, fn) };
      }
      return mapped;
    });
  }

  private updatePostComments(postId: string, fn: (cvm: CommentVM) => CommentVM): void {
    this.posts.update(list => list.map(v =>
      v.post.id === postId ? { ...v, comments: this.mapComments(v.comments, fn) } : v
    ));
  }

  private loadCommentAuthor(autorId: string, postId: string): void {
    this.cargarAutoresComentarios([autorId], postId);
  }

  /** Autores de los comentarios de un post (o de un hilo) en UNA sola peticion. */
  private cargarAutoresComentarios(autorIds: string[], postId: string): void {
    const pedidos = [...new Set(autorIds)].filter(id => !!id);
    const faltantes = pedidos.filter(id => !this.userCache.has(id));

    const aplicar = () => pedidos.forEach(id => {
      const info = this.userCache.get(id);
      if (info) this.aplicarAutorComentario(id, postId, info);
    });

    if (faltantes.length === 0) {
      aplicar();
      return;
    }

    this.userStore.getByIds(faltantes).subscribe({
      next: (usuarios: any[]) => {
        usuarios.forEach(u => {
          if (u?.id) this.userCache.set(u.id, { nombre: u.nombre ?? 'Usuario', avatar: u.fotoPerfilUrl ?? '' });
        });
        aplicar();
      },
      error: () => {}
    });
  }

  private aplicarAutorComentario(autorId: string, postId: string, info: { nombre: string; avatar: string }): void {
    this.updatePostComments(postId, c =>
      c.comment.autorId === autorId ? { ...c, autorNombre: info.nombre, autorAvatar: info.avatar } : c
    );
  }

  /** Mis reacciones a los comentarios de un post (incluye respuestas) en UNA peticion. */
  private cargarMisReaccionesComentarios(commentIds: string[], postId: string): void {
    const userId = this.getUserId();
    if (!userId || commentIds.length === 0) return;

    this.reactionService.getMyReactions(userId, 'COMMENT', commentIds).subscribe({
      next: (reacciones) => {
        const tipoDe = new Map(reacciones.map(r => [r.objetivoId, r.tipoReaccion as TipoReaccion]));
        this.updatePostComments(postId, c => {
          const tipo = tipoDe.get(c.comment.id);
          return tipo ? { ...c, myReaction: tipo } : c;
        });
      },
      error: () => {}
    });
  }

  private loadMyReactionForVm(postId: string, commentId: string): void {
    const userId = this.getUserId();
    if (!userId) return;

    this.reactionService.getMyReaction(userId, commentId, 'COMMENT').subscribe({
      next: (r: any) => {
        if (r) {
          this.updatePostComments(postId, c =>
            c.comment.id === commentId ? { ...c, myReaction: r.tipoReaccion } : c
          );
        }
      }
    });
  }

  openCommentsModal(vm: PostVM): void {
    this.modalPostId.set(vm.post.id);
    if (vm.comments.length === 0) {
      this.loadComments(vm);
    }
    this.showCommentsModal.set(true);
  }

  closeCommentsModal(): void {
    this.showCommentsModal.set(false);
    this.modalNewComment = '';
  }

  addComment(vm: PostVM): void {
    this.addCommentToPost(vm.post.id, vm.newComment);
  }

  addCommentToPost(postId: string, text: string): void {
    const userId = this.getUserId();
    const value = text.trim();
    if (!userId || !value) return;

    this.commentService.createComment(userId, postId, value, 'POST').subscribe({
      next: (created: SocialComment) => {
        if (!created) return;

        const newVm = this.buildCommentVm(created);
        const cached = this.userCache.get(userId);
        newVm.autorNombre = cached?.nombre ?? '';
        newVm.autorAvatar = cached?.avatar ?? '';

        this.posts.update(list => list.map(v =>
          v.post.id === postId ? { ...v, comments: [...v.comments, newVm], newComment: '' } : v
        ));
        this.bumpCommentCount(postId, 1);
        this.loadCommentAuthor(created.autorId, postId);
        this.modalNewComment = '';
      },
      error: (err) => console.error('Failed to create comment:', err)
    });
  }

  // ─── Comment Reacciones ───

  toggleCommentReactionsDropdown(commentVm: CommentVM): void {
    const targetId = commentVm.comment.id;
    const willOpen = !commentVm.showReactionDropdown;
    this.posts.update(list => list.map(v => ({
      ...v,
      showReactionsDropdown: false,
      comments: this.setCommentDropdown(v.comments, targetId, willOpen),
    })));
  }

  getCommentReactionText(commentVm: CommentVM): string {
    if (!commentVm.myReaction) return 'Like';
    const config = this.reactionConfig[commentVm.myReaction];
    return `${config.emoji} ${config.label}`;
  }

  selectCommentReaction(commentVm: CommentVM, type: TipoReaccion, postId: string): void {
    const commentId = commentVm.comment.id;
    const currentCount = commentVm.comment.reaccionesCount ?? 0;
    const myReaction = commentVm.myReaction;
    this.closeAllDropdowns();

    const userId = this.getUserId();
    if (!userId) return;

    if (myReaction === type) {
      this.reactionService.unreact(userId, commentId, 'COMMENT').subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? {
            ...c,
            myReaction: null,
            comment: { ...c.comment, reaccionesCount: Math.max(0, currentCount - 1) }
          } : c
        ),
        error: (err) => console.error('Failed to unreact comment:', err)
      });
    } else if (myReaction) {
      this.reactionService.react(userId, commentId, 'COMMENT', type).subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? { ...c, myReaction: type } : c
        ),
        error: (err) => console.error('Failed to change comment reaction:', err)
      });
    } else {
      this.reactionService.react(userId, commentId, 'COMMENT', type).subscribe({
        next: () => this.updatePostComments(postId, c =>
          c.comment.id === commentId ? {
            ...c,
            myReaction: type,
            comment: { ...c.comment, reaccionesCount: currentCount + 1 }
          } : c
        ),
        error: (err) => console.error('Failed to react comment:', err)
      });
    }
  }

  // ─── Replies ───

  toggleReplyInput(commentVm: CommentVM): void {
    commentVm.showReplyInput = !commentVm.showReplyInput;
  }

  toggleReplies(commentVm: CommentVM, postId: string): void {
    const show = !commentVm.showReplies;
    this.updatePostComments(postId, c =>
      c.comment.id === commentVm.comment.id ? { ...c, showReplies: show } : c
    );
    if (show && !commentVm.repliesLoaded) {
      this.loadReplies(commentVm, postId);
    }
  }

  private loadReplies(commentVm: CommentVM, postId: string): void {
    this.commentService.getReplies(commentVm.comment.id).subscribe({
      next: (replies: SocialComment[]) => {
        const vms = replies.map(r => this.buildCommentVm(r));
        this.updatePostComments(postId, c =>
          c.comment.id === commentVm.comment.id
            ? { ...c, replies: vms, repliesLoaded: true, repliesCount: Math.max(c.repliesCount, vms.length) }
            : c
        );
        this.cargarAutoresComentarios(replies.map(r => r.autorId), postId);
        this.cargarMisReaccionesComentarios(replies.map(r => r.id), postId);
      },
      error: (err) => console.error('Failed to load replies:', err)
    });
  }

  addReply(commentVm: CommentVM, postId: string): void {
    const userId = this.getUserId();
    const text = commentVm.replyText.trim();
    if (!userId || !text) return;

    const wasLoaded = commentVm.repliesLoaded;

    this.commentService.createComment(userId, postId, text, 'POST', commentVm.comment.id).subscribe({
      next: (created: SocialComment) => {
        if (!created) return;

        const newReply = this.buildCommentVm(created);
        const cached = this.userCache.get(userId);
        newReply.autorNombre = cached?.nombre ?? '';
        newReply.autorAvatar = cached?.avatar ?? '';

        this.updatePostComments(postId, c => {
          if (c.comment.id !== commentVm.comment.id) return c;
          return {
            ...c,
            replies: wasLoaded ? [...c.replies, newReply] : c.replies,
            repliesCount: c.repliesCount + 1,
            showReplies: true,
            replyText: '',
            showReplyInput: false,
          };
        });

        if (!wasLoaded) {
          this.loadReplies(commentVm, postId);
        }
        this.bumpCommentCount(postId, 1);
      },
      error: (err) => console.error('Failed to create reply:', err)
    });
  }

  // ─── Editar / eliminar ───

  startEdit(vm: PostVM): void {
    vm.isEditing = true;
    vm.editText = vm.post.contenido?.texto ?? '';
  }

  saveEdit(vm: PostVM): void {
    this.postService.updatePost(vm.post.id, { contenido: { texto: vm.editText.trim() } }).subscribe({
      next: (updated: any) => {
        if (updated) {
          this.posts.update(list => list.map(v => v.post.id === vm.post.id ? {
            ...v,
            isEditing: false,
            post: { ...v.post, contenido: { ...v.post.contenido, texto: vm.editText.trim() } }
          } : v));
          this.toast.success('Publicación actualizada');
        }
      },
      error: () => this.toast.error('Error al actualizar publicación')
    });
  }

  cancelEdit(vm: PostVM): void {
    this.posts.update(list => list.map(v => v.post.id === vm.post.id ? { ...v, isEditing: false, editText: '' } : v));
  }

  askDeletePost(vm: PostVM): void {
    this.pendingDeleteId.set(vm.post.id);
    this.deleteConfirmOpen.set(true);
  }

  onCancelDelete(): void {
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const postId = this.pendingDeleteId();
    this.deleteConfirmOpen.set(false);
    this.pendingDeleteId.set(null);
    if (!postId) return;

    this.postService.deletePost(postId).subscribe({
      next: (ok: boolean) => {
        if (ok) {
          this.posts.update(list => list.filter(p => p.post.id !== postId));
          this.toast.success('Publicación eliminada');
        } else {
          this.toast.error('No se pudo eliminar la publicación');
        }
      },
      error: () => this.toast.error('Error al eliminar publicación')
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }

  goToProfile(autorId: string): void {
    this.router.navigate(['/profile', autorId]);
  }
}
