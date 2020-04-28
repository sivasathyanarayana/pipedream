const _ = require("lodash")
const googleCalendar = require('https://github.com/PipedreamHQ/pipedream/components/google-calendar/google-calendar.app.js')

module.exports = {
  name: 'google-calendar-event-cancelled',
  version: '0.0.1',
  props: {
    googleCalendar,
    calendarId: {
      type: "string",
      async options() {
        const calListResp = await this.googleCalendar.calendarList()
        const calendars = _.get(calListResp, "data.items")
        if (calendars) {
          const calendarIds = calendars.map(item => { return {value: item.id, label: item.summary} })
          return calendarIds
        }
        return []
      }
    },
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 5 * 60,
      },
    },
  },
  async run(event) {
    const intervalMs = 1000 * (event.interval_seconds || 300) // fall through to default for manual testing
    const now = new Date()

    const updatedMin = new Date(now.getTime() - intervalMs).toISOString()

    const config = {
      calendarId: this.calendarId,
      updatedMin,
      showDeleted: true,
      singleEvents: true,
      orderBy: "startTime",
    }
    const resp = await this.googleCalendar.getEvents(config)

    const events = _.get(resp.data, "items")
    if (Array.isArray(events)) {
      for (const event of events) {
        // only emit if status is cancelled
        if (event.status === "cancelled") {
          this.$emit(event)
        }
      }
    } else {
      console.log("nothing to emit")
    }
  },
}