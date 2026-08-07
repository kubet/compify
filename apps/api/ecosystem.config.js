// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'compify-back',
        script: 'dist/main.js',
        interpreter: 'bun',
        watch: false,
        exec_mode: 'cluster',
        instances: 2,
        env: {
            NODE_ENV: 'prod',
            STAGE: 'prod',
            PORT: 3091
        },
        max_memory_restart: '1G',
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        time: true,
        wait_ready: true,
        listen_timeout: 10000,
        kill_timeout: 15000,
        restart_delay: 2000
    }]
}