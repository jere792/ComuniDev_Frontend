import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

@Component({
  selector: 'app-contact-messenger',
  imports: [FormsModule],
  templateUrl: './messenger.html',
  styleUrl: './messenger.scss',
})
export class ContactMessenger implements AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef<HTMLDivElement>;

  messages = signal<ChatMessage[]>([]);
  currentStep = signal(0);
  isTyping = signal(false);
  inputValue = signal('');
  isComplete = signal(false);
  typewriterText = signal('');
  showWelcome = signal(true);
  private shouldScroll = false;
  private typewriterInterval: ReturnType<typeof setInterval> | null = null;

  mascotUrl = 'https://res.cloudinary.com/dp1vgjhsq/image/upload/v1788774945/buble_mascota_kmpn3v.png';
  welcomeMascotUrl = 'https://res.cloudinary.com/dp1vgjhsq/image/upload/v1788776471/saludo_mascota_xptkk8.png';

  steps = [
    { type: 'greeting', botMessage: '¡Hola! 👋 Bienvenido a SolveGrades. Soy Nexo, tu asistente virtual.' },
    { type: 'text', key: 'nombre', botMessage: '¿Cuál es tu nombre?' },
    { type: 'text', key: 'apellido', botMessage: '¿Cuál es tu apellido?' },
    { type: 'text', key: 'telefono', botMessage: '¿Cuál es tu número de teléfono?' },
    { type: 'selector', key: 'asunto', botMessage: '¿Cuál es el motivo de tu consulta?', options: [
      { value: 'soporte', label: 'Soporte técnico' },
      { value: 'cuenta', label: 'Mi cuenta' },
      { value: 'colaboracion', label: 'Colaboración' },
      { value: 'otro', label: 'Otro' },
    ]},
    { type: 'text', key: 'descripcion', botMessage: 'Describe brevemente tu consulta.' },
    { type: 'text', key: 'correo', botMessage: '¿Cuál es tu correo electrónico?' },
  ];

  data: Record<string, string> = {};

  onStartChat(): void {
    this.showWelcome.set(false);
    this.runBotStep();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private getTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  private async typewriterEffect(fullText: string): Promise<void> {
    return new Promise(resolve => {
      this.typewriterText.set('');
      let i = 0;
      this.typewriterInterval = setInterval(() => {
        if (i < fullText.length) {
          this.typewriterText.set(fullText.substring(0, i + 1));
          this.shouldScroll = true;
          i++;
        } else {
          if (this.typewriterInterval) {
            clearInterval(this.typewriterInterval);
            this.typewriterInterval = null;
          }
          resolve();
        }
      }, 30);
    });
  }

  private async runBotStep(): Promise<void> {
    const step = this.steps[this.currentStep()];
    if (!step) {
      this.showSummary();
      return;
    }

    this.isTyping.set(true);
    this.shouldScroll = true;
    await this.delay(1200);

    this.isTyping.set(false);
    await this.typewriterEffect(step.botMessage);

    this.messages.update(msgs => [...msgs, { sender: 'bot', text: step.botMessage, time: this.getTime() }]);
    this.typewriterText.set('');
    this.shouldScroll = true;
  }

  async sendMessage(): Promise<void> {
    const value = this.inputValue().trim();
    if (!value || this.isTyping()) return;

    const step = this.steps[this.currentStep()];
    this.data[step.key!] = value;

    this.messages.update(msgs => [...msgs, { sender: 'user', text: value, time: this.getTime() }]);
    this.inputValue.set('');
    this.shouldScroll = true;

    this.currentStep.set(this.currentStep() + 1);
    await this.runBotStep();
  }

  async selectOption(value: string, label: string): Promise<void> {
    const step = this.steps[this.currentStep()];
    this.data[step.key!] = label;

    this.messages.update(msgs => [...msgs, { sender: 'user', text: label, time: this.getTime() }]);
    this.shouldScroll = true;

    this.currentStep.set(this.currentStep() + 1);
    await this.runBotStep();
  }

  private async showSummary(): Promise<void> {
    this.isTyping.set(true);
    this.shouldScroll = true;
    await this.delay(1500);

    this.isTyping.set(false);
    const summary = [
      '¡Gracias! 🎉 Aquí está el resumen de tu consulta:',
      '',
      `👤 ${this.data['nombre']} ${this.data['apellido']}`,
      `📞 ${this.data['telefono']}`,
      `📋 ${this.data['asunto']}`,
      `💬 ${this.data['descripcion']}`,
      `✉️ ${this.data['correo']}`,
      '',
      'Un representante se pondrá en contacto contigo pronto.',
    ].join('\n');

    await this.typewriterEffect(summary);

    this.messages.update(msgs => [...msgs, { sender: 'bot', text: summary, time: this.getTime() }]);
    this.typewriterText.set('');
    this.isComplete.set(true);
    this.shouldScroll = true;
  }

  get currentStepData() {
    return this.steps[this.currentStep()];
  }

  get placeholder(): string {
    const step = this.currentStepData;
    if (!step || step.type === 'selector') return 'Escribe un mensaje...';
    const placeholders: Record<string, string> = {
      nombre: 'Tu nombre...',
      apellido: 'Tu apellido...',
      telefono: '+51 999 999 999...',
      descripcion: 'Describe tu consulta...',
      correo: 'tu@email.com...',
    };
    return placeholders[step.key!] || 'Escribe un mensaje...';
  }

  private scrollToBottom(): void {
    if (this.chatBody) {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
