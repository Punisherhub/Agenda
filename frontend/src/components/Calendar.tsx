import React, { useState, useCallback, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Agendamento, Servico, Cliente } from '../types'
import '../styles/calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const locales = {
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const DnDCalendar = withDragAndDrop(BigCalendar)

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: Agendamento
}

interface CalendarProps {
  agendamentos: Agendamento[]
  servicos: Servico[]
  clientes: Cliente[]
  onSelectSlot: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void
  onSelectEvent: (event: CalendarEvent) => void
  onCreateAgendamento: (data: { start: Date; end: Date }) => void
  onEventResize?: (data: { event: CalendarEvent; start: Date; end: Date }) => void
  onEventDrop?: (data: { event: CalendarEvent; start: Date; end: Date }) => void
  loading?: boolean
}

const Calendar: React.FC<CalendarProps> = ({
  agendamentos,
  servicos,
  clientes,
  onSelectSlot,
  onSelectEvent,
  onCreateAgendamento,
  onEventResize,
  onEventDrop,
  loading = false
}) => {
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  // Converter agendamentos para eventos do calendário
  const events: CalendarEvent[] = useMemo(() => {
    return agendamentos.map((agendamento) => {
      const servico = servicos.find(s => s.id === agendamento.servico_id)
      const cliente = clientes.find(c => c.id === agendamento.cliente_id) || agendamento.cliente

      return {
        id: agendamento.id,
        title: `${cliente?.nome || 'Cliente'} - ${servico?.nome || 'Serviço'}`,
        start: new Date(agendamento.data_inicio),
        end: new Date(agendamento.data_fim),
        resource: agendamento
      }
    })
  }, [agendamentos, servicos, clientes])

  // Personalizar cores dos eventos baseado no status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status
    const servico = servicos.find(s => s.id === event.resource.servico_id)
    let backgroundColor = '#3b82f6' // blue padrão
    let fontWeight = 'normal'
    let textDecoration = 'none'

    switch (status) {
      case 'AGENDADO':
        // Usar cor do serviço para agendamentos
        backgroundColor = servico?.cor || '#3b82f6'
        break
      case 'CONFIRMADO':
        backgroundColor = '#10b981' // green
        break
      case 'EM_ANDAMENTO':
        backgroundColor = '#f59e0b' // yellow/amber
        break
      case 'CONCLUIDO':
        backgroundColor = '#059669' // emerald escuro
        fontWeight = 'bold'
        textDecoration = 'underline'
        break
      case 'CANCELADO':
        backgroundColor = '#ef4444' // red
        break
      case 'NAO_COMPARECEU':
        backgroundColor = '#6b7280' // gray
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '13px',
        padding: '2px 6px',
        fontWeight,
        textDecoration
      }
    }
  }, [servicos])

  // Handlers para drag and drop
  const handleEventResize = useCallback(({ event, start, end }: any) => {
    if (onEventResize) {
      onEventResize({ event, start, end })
    }
  }, [onEventResize])

  const handleEventDrop = useCallback(({ event, start, end }: any) => {
    if (onEventDrop) {
      onEventDrop({ event, start, end })
    }
  }, [onEventDrop])

  // Customizar toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{label}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: Views.DAY, label: 'Dia' },
            { key: Views.WEEK, label: 'Semana' },
            { key: Views.MONTH, label: 'Mês' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onView(key)}
              className={`px-4 py-2 rounded-md transition-colors ${
                view === key
                  ? 'bg-white shadow-sm text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // Customizar evento
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const agendamento = event.resource
    const servico = servicos.find(s => s.id === agendamento.servico_id)
    const isConcluido = agendamento.status === 'CONCLUIDO'

    return (
      <div className="p-1">
        <div className={`font-medium text-sm truncate ${isConcluido ? 'font-bold' : ''}`}>
          {isConcluido && '✓ '}
          {event.title}
          {isConcluido && ' ✓'}
        </div>
        <div className="flex items-center text-xs opacity-90 mt-1">
          <Clock className="w-3 h-3 mr-1" />
          {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
        </div>
        {servico && (
          <div className="text-xs opacity-90 truncate">
            R$ {Number(agendamento.valor_final || servico.preco).toFixed(2)}
          </div>
        )}
        {isConcluido && (
          <div className="text-xs font-bold mt-1 bg-white bg-opacity-30 px-1 rounded">
            FINALIZADO
          </div>
        )}
      </div>
    )
  }

  // Mensagens customizadas
  const messages = {
    allDay: 'Todo dia',
    previous: 'Anterior',
    next: 'Próximo',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'Não há agendamentos neste período.',
    showMore: (total: number) => `+ ${total} mais`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando calendário...</span>
        </div>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <style>{`
          .rbc-calendar {
            font-family: inherit;
          }
          .rbc-header {
            padding: 12px 6px;
            font-weight: 600;
            color: #374151;
            background-color: #f9fafb;
            border-bottom: 1px solid #e5e7eb;
          }
          .rbc-date-cell {
            padding: 8px;
            text-align: right;
          }
          .rbc-date-cell.rbc-off-range {
            color: #9ca3af;
          }
          .rbc-date-cell.rbc-now {
            background-color: #dbeafe;
            font-weight: 600;
          }
          .rbc-time-slot {
            border-top: 1px solid #f3f4f6;
          }
          .rbc-time-gutter {
            background-color: #f9fafb;
          }
          .rbc-today {
            background-color: #f0f9ff;
          }
          .rbc-current-time-indicator {
            background-color: #ef4444;
            height: 2px;
          }
          .rbc-event {
            border-radius: 4px;
            padding: 2px 6px;
          }
          .rbc-event:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          .rbc-slot-selecting {
            background-color: rgba(59, 130, 246, 0.1);
          }
          .rbc-slot-selection {
            background-color: rgba(59, 130, 246, 0.2);
            border: 1px solid #3b82f6;
          }
        `}</style>

        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          resizable
          onSelectSlot={onSelectSlot}
          onSelectEvent={onSelectEvent as any}
          onEventResize={handleEventResize as any}
          onEventDrop={handleEventDrop as any}
          eventPropGetter={eventStyleGetter as any}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent as any
          }}
          messages={messages}
          culture="pt-BR"
          step={30}
          timeslots={2}
          min={new Date(2000, 0, 1, 7, 0)} // 7:00 AM
          max={new Date(2000, 0, 1, 20, 0)} // 8:00 PM
        />
      </div>
    </DndProvider>
  )
}

export default Calendar