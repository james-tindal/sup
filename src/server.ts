import { App } from '#/core/app'

const port = process.env.PORT || 8080
App().listen(port, () => console.log(`Listening on port ${port}`))
