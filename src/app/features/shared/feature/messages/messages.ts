import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageStore } from '@features/shared/data-access/state/message.store';
import { MessageConversation } from '@features/shared/domain/models/message.model';
import { UserStore } from '@features/users/data-access/state/user.store';
import { User } from '@core/domain/models/user.model';

/** Pantalla de mensajes, compartida por reclutador y developer. */
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './messages.html',
  styleUrl: './messages.scss',
})
export class Messages implements OnInit, AfterViewChecked {

  private store = inject(MessageStore);
  private userStore = inject(UserStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  readonly conversaciones = this.store.conversaciones;
  readonly solicitudes = this.store.solicitudes;
  readonly mensajes = this.store.mensajes;
  readonly abierta = this.store.abierta;
  readonly cargando = this.store.cargandoConversaciones;
  readonly cargandoSolicitudes = this.store.cargandoSolicitudes;
  readonly cargandoMensajes = this.store.cargandoMensajes;
  readonly enviando = this.store.enviando;

  /** Como Instagram: la pestaña principal y la de solicitudes pendientes. */
  readonly pestana = signal<'conversaciones' | 'solicitudes'>('conversaciones');

  /**
   * Como Instagram en movil: cuando hay un chat abierto (/messages/:id)
   * se oculta la lista y la conversacion ocupa toda la pantalla.
   */
  readonly mostrarChat = signal(false);

  usersMap = signal<Map<string, User>>(new Map());
  borrador = '';

  @ViewChild('scrollChat') private scrollChat?: ElementRef<HTMLElement>;
  private userId: string | null = null;
  private totalVisto = 0;

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId');
    if (!this.userId) return;

    this.cargarUsuarios();
    this.store.cargarConversaciones(this.userId);
    this.store.cargarSolicitudes(this.userId);
    // El canal de tiempo real esta abierto todo el tiempo que dure la pantalla.
    this.store.escuchar(this.userId);

    // /recruiter/messages/<otroUserId>: la subruta define el chat abierto.
    // Si el id cambia (u otro clic en la lista) se abre ese hilo; sin id
    // se vuelve a la lista. El guard evita reabrir el que ya esta abierto.
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.mostrarChat.set(true);
        if (this.abierta()?.otroUserId !== id) this.store.abrirCon(this.userId, id);
      } else {
        this.mostrarChat.set(false);
      }
    });

    // /recruiter/messages?user=<id>, para escribirle a alguien desde su perfil.
    const otroUserId = this.route.snapshot.queryParamMap.get('user');
    if (otroUserId) {
      this.mostrarChat.set(true);
      this.store.abrirCon(this.userId, otroUserId);
    }
  }

  cambiarPestana(pestana: 'conversaciones' | 'solicitudes'): void {
    this.pestana.set(pestana);
  }

  aceptarSolicitud(conversation: MessageConversation): void {
    if (!this.userId) return;
    this.store.aceptar(conversation, this.userId);
  }

  rechazarSolicitud(conversation: MessageConversation): void {
    if (!this.userId) return;
    this.store.rechazar(conversation, this.userId);
  }

  /** Baja al ultimo mensaje cada vez que la lista crece, sin repetir el trabajo. */
  ngAfterViewChecked(): void {
    const total = this.mensajes().length;
    if (total === this.totalVisto) return;
    this.totalVisto = total;

    const chat = this.scrollChat?.nativeElement;
    if (chat) chat.scrollTop = chat.scrollHeight;
  }

  abrirHilo(conversation: MessageConversation): void {
    if (!this.userId) return;
    this.store.abrir(conversation, this.userId);
    // Instagram: la URL refleja la conversacion abierta (subruta con el id
    // del otro usuario). En escritorio no cambia el layout.
    this.router.navigate([this.rutaMensajes(), conversation.otroUserId]);
  }

  /** En movil, la flecha del header vuelve a la lista de conversaciones. */
  volverALista(): void {
    this.mostrarChat.set(false);
    this.router.navigate([this.rutaMensajes()]);
  }

  enviar(): void {
    if (!this.userId) return;

    const texto = this.borrador.trim();
    const receptorId = this.abierta()?.otroUserId;
    if (!texto || !receptorId || this.enviando()) return;

    this.borrador = '';
    this.store.enviar(this.userId, receptorId, texto);
  }

  esMio(emisorId: string | null): boolean {
    return emisorId != null && emisorId === this.userId;
  }

  nombreDe(userId: string | null): string {
    if (!userId) return 'Usuario';
    return this.usersMap().get(userId)?.nombre || 'Usuario';
  }

  fotoDe(userId: string | null): string | null {
    return userId ? this.usersMap().get(userId)?.fotoPerfilUrl ?? null : null;
  }

  /** Sin foto no se usa ninguna imagen de relleno: se ven las iniciales. */
  iniciales(userId: string | null): string {
    const nombre = this.nombreDe(userId);
    return nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  }

  horaDe(fecha: string | null): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    const hora = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const mismoDia = date.toDateString() === new Date().toDateString();
    return mismoDia
      ? hora
      : `${date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })} ${hora}`;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    this.router.navigate([this.rutaInicio()]);
  }

  /** La misma pantalla sirve para los dos roles, asi que el inicio cambia. */
  private rutaInicio(): string {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role === 'desarrollador' || role === 'developer') return '/developer/inicio';
    return '/recruiter/inicio';
  }

  /** Base de la ruta de mensajes segun el rol (/developer o /recruiter). */
  private rutaMensajes(): string {
    const role = (localStorage.getItem('role') || '').toLowerCase();
    if (role === 'desarrollador' || role === 'developer') return '/developer/messages';
    return '/recruiter/messages';
  }

  private cargarUsuarios(): void {
    this.userStore.getAll().subscribe({
      next: (users: User[]) => {
        const map = new Map<string, User>();
        users.forEach(user => { if (user.id) map.set(user.id, user); });
        this.usersMap.set(map);
      },
    });
  }
}
