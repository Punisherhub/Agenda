import React, { useState, useCallback, useMemo } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Agendamento, Servico, Cliente } from '../types'
import { formatBrazilTime } from '../utils/timezone'
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
  onEventResize?: (data: { event: CalendarEvent; start: Date; end: Date }) => void
  onEventDrop?: (data: { event: CalendarEvent; start: Date; end: Date }) => void
  loading?: boolean
  processingIds?: Set<number>
}

const Calendar: React.FC<CalendarProps> = ({
  agendamentos,
  servicos,
  clientes,
  onSelectSlot,
  onSelectEvent,
  onEventResize,
  onEventDrop,
  loading = false,
  processingIds = new Set()
}) => {
  const [view, setView] = useState<View>(Views.WEEK)
  const [date, setDate] = useState(new Date())

  // Converter agendamentos para eventos do calendário
  const events: CalendarEvent[] = useMemo(() => {
    return agendamentos.map((agendamento) => {
      const servico = servicos.find(s => s.id === agendamento.servico_id)
      const cliente = clientes.find(c => c.id === agendamento.cliente_id) || agendamento.cliente

      // DEBUG: Log para verificar conversão de datas
      const startDate = new Date(agendamento.data_inicio)
      const endDate = new Date(agendamento.data_fim)

      if (startDate.getHours() >= 21) {
        console.log('🔍 [CALENDAR DEBUG] Agendamento após 21h:', {
          id: agendamento.id,
          data_inicio_raw: agendamento.data_inicio,
          data_fim_raw: agendamento.data_fim,
          start_Date_object: startDate,
          start_getHours: startDate.getHours(),
          end_Date_object: endDate,
          end_getHours: endDate.getHours()
        })
      }

      return {
        id: agendamento.id,
        title: `${cliente?.nome || 'Cliente'} - ${servico?.nome || 'Serviço'}`,
        start: startDate,
        end: endDate,
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
      case 'CONCLUIDO':
        backgroundColor = '#059669' // emerald escuro
        fontWeight = 'bold'
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

  // Customizar evento para visualização de semana/dia
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const agendamento = event.resource
    const servico = servicos.find(s => s.id === agendamento.servico_id)
    const isConcluido = agendamento.status === 'CONCLUIDO'
    const isProcessing = processingIds.has(agendamento.id)

    return (
      <div className="p-1 relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10 rounded">
            <span className="animate-spin text-2xl">⟳</span>
          </div>
        )}
        <div className={`font-medium text-sm truncate ${isConcluido ? 'font-bold' : ''}`}>
          {isConcluido && '✓ '}
          {event.title}
          {isConcluido && ' ✓'}
        </div>
        <div className="flex items-center text-xs opacity-90 mt-1">
          <Clock className="w-3 h-3 mr-1" />
          {formatBrazilTime(event.resource.data_inicio)} - {formatBrazilTime(event.resource.data_fim)}
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

  // Componente customizado para visualização de mês (apenas contagem)
  const MonthEvent = ({ event }: { event: CalendarEvent }) => {
    return (
      <div className="text-xs truncate px-1 py-0.5">
        {formatBrazilTime(event.resource.data_inicio)}
      </div>
    )
  }

  // Componente customizado para célula de data no mês
  const MonthDateHeader = ({ date }: any) => {
    // Contar agendamentos para este dia
    const dayEvents = events.filter(event => {
      const eventDate = format(event.start, 'yyyy-MM-dd')
      const currentDate = format(date, 'yyyy-MM-dd')
      return eventDate === currentDate
    })

    return (
      <div className="rbc-date-cell">
        <div className="font-semibold text-gray-700">
          {format(date, 'd')}
        </div>
        {dayEvents.length > 0 && (
          <div className="mt-1 text-center">
            <span className="inline-flex items-center justify-center bg-blue-600 text-white text-xs font-semibold rounded-full w-6 h-6">
              {dayEvents.length}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Componente wrapper para célula do dia inteiro (torna toda área clicável)
  const DateCellWrapper = ({ children, value }: any) => {
    const handleClick = () => {
      if (view === Views.MONTH) {
        handleDrillDown(value)
      }
    }

    return (
      <div
        className={view === Views.MONTH ? 'month-day-cell-clickable' : ''}
        onClick={handleClick}
      >
        {children}
      </div>
    )
  }

  // Handler para drill down (clicar em uma data no mês)
  const handleDrillDown = useCallback((date: Date) => {
    setDate(date)
    setView(Views.WEEK)
  }, [])

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
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

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
            text-align: center;
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

          /* Ocultar eventos na visualização de mês - apenas mostrar o contador no dateHeader */
          .rbc-month-view .rbc-event {
            display: none !important;
          }
          .rbc-month-view .rbc-row-content {
            pointer-events: none;
          }
          .rbc-month-view .rbc-date-cell {
            min-height: 80px;
            padding: 4px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            pointer-events: none;
          }
          .rbc-month-view .rbc-row-segment {
            display: none;
          }

          /* Tornar toda a célula do dia clicável no mês */
          .month-day-cell-clickable {
            cursor: pointer;
            transition: background-color 0.2s ease;
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          .month-day-cell-clickable:hover {
            background-color: #eff6ff !important;
          }
          .month-day-cell-clickable:active {
            background-color: #dbeafe !important;
          }
          .rbc-month-view .rbc-day-bg {
            cursor: pointer;
          }
        `}</style>

        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => new Date(event.start)}
          endAccessor={(event: any) => new Date(event.end)}
          style={{ height: 600 }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable={view !== Views.MONTH}
          resizable={view !== Views.MONTH}
          onSelectSlot={view !== Views.MONTH ? onSelectSlot : undefined}
          onSelectEvent={onSelectEvent as any}
          onEventResize={handleEventResize as any}
          onEventDrop={handleEventDrop as any}
          onDrillDown={handleDrillDown}
          eventPropGetter={eventStyleGetter as any}
          components={{
            toolbar: CustomToolbar,
            event: EventComponent as any,
            dateCellWrapper: DateCellWrapper as any,
            month: {
              event: MonthEvent as any,
              dateHeader: MonthDateHeader as any
            }
          }}
          messages={messages}
          culture="pt-BR"
          step={30}
          timeslots={2}
          min={new Date(2000, 0, 1, 7, 0)} // 7:00 AM
        />
      </div>
    </DndProvider>
  )
}

export default Calendar