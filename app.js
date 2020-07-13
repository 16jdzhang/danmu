const NodeMediaServer = require('node-media-server');

const config = {
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        mediaroot: './media',
        allow_origin: '*'
    },
    trans: {
        ffmpeg: './ffmpeg.exe',
        tasks: [
        {
            app: 'live',
            hls: true,
            hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
            dash: true,
            dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
        }
        ]
    }
};
    

var nms = new NodeMediaServer(config);
nms.run();

var http = require('http');
var express = require('express');
const WebSocket = require('ws');

var app = express();
const wss = new WebSocket.Server({ noServer: true });

setImmediate(()=>{
    var server = http.createServer(app);
    server.on('upgrade', function upgrade(request, socket, head) {
        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request);
        });
    });
    server.listen(80);
});
 
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(data) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });
});

app.get('/', (req, res)=>{
    res.write(`
    <html>
    <head>
    <script src="http://cdn.bootcss.com/flv.js/1.5.0/flv.min.js"></script>
    </head>
    <body>
    <video id="videoElement"></video>
    <br/>
    <button id="play">play</button>
    <input type="text" id="it"/>
    <button id="send">send</button>
    <div id="danmu" style="position: absolute;left:0px; top:0px;"></div>
    <script>
        if (flvjs.isSupported()) {
            var videoElement = document.getElementById('videoElement');
            var flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: 'http://localhost:8000/live/STREAM_NAME.flv'
            });
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();
            play.onclick = function(){
                flvPlayer.play();
            }
        }
        
        var ws = new WebSocket("ws://localhost:80/");
        var danmuid = Number(0);
        ws.onmessage = function (evt) 
        { 
            var received_msg = evt.data;
            var id = danmuid;
            danmuid += 1;
            danmu.innerHTML += '<p id="dm'+id+'">'+received_msg+'</p>';
            setTimeout(function(){
                danmu.removeChild(document.getElementById("dm"+id));
            }, 5000);
        };
        send.onclick = function(){
            ws.send(it.value);
        }
    </script>
    </body>
    </html>
    `);
    res.end();
});