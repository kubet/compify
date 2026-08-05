module.exports = {
    apps: [{
        name: 'compify-front',
        script: 'node_modules/next/dist/bin/next',
        args: 'start',
        watch: false,
        exec_mode: 'cluster',
        instances: 2,
        max_memory_restart: '1G',
        env: {
            PORT: process.env.PORT || 3000,
            NODE_ENV: 'production'
        },
        kill_timeout: 15000,
        wait_ready: true,
        listen_timeout: 10000
    }]
}