const cam = document.getElementById('cam')

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
        if(Array.isArray(devices)) {
            devices.forEach(device => {
                if(device.kind == 'videoinput'){
                    if(device.label.includes('')){ //parte do label da cam, caso tenha mais de 1
                        navigator.getUserMedia(
                            {video: {
                                deviceId: device.deviceId
                            }},
                            stream => cam.srcObject = stream,
                            error => console.log(error)
                        )
                    }                    
                }
            })
        }
    })
}

const loadLabels = () => {
    const labels = ['Aaron_Eckhart', 'Aaron_Sorkin',
    'Aaron_Tippin', 'Abba_Eban','Abdel_Nasser', 'Abdulaziz_Kamilov',
    'Abdullah','Abdullah_Ahmad', 'Amelia_Vega', 'Amelie_Mauresmo', 'Amer_Saadi', 'Ana_Guevara',
    'Ana_Palacio', 'Anastasia_Myskina', 'Anders_Ebbeson', 'Anders_Fogh', 'Andre_Agassi',
    'Andrew_Niccol', 'Andrew_Weissmann', 'Andrzej_Tyszkiewicz', 'Andy_Hebb', 'Andy_Roddick', 'Arnold_Schwarz',
    'Bashar_Assad', 'Ben_Affleck', 'Ben_Curtis', 'Bill_Gates', 'Cecilia',
    'Lucas_Wallace', 'Ricchard', 'Sandrerley', 'Thais_Alexandra']//*] trocar pelo 'Lucas_Wallace' pro 2º teste 'Aaron_Pena'


//ALGUMAS PASTAS DE ALGUMAS PESSOAS ESTAO BUGANDO, VERIFICAR O INDICE RETORANDO NO ERRO DO NAVEGADOR E APAGAR ELE AQUI

    return Promise.all(labels.map(async label => {
        const descriptions = []

        for (let i = 1;i <= 3; i++){
            const img = await faceapi.fetchImage(`/lib/labels/${label}/img${i}.jpg`)
            
            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()
            descriptions.push(detections.descriptor)
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions) //pro LucasWallace(label), tenho as descrições (usadas no programa, so n sei oq)
    }))
}

//redes neurais do face-api
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/lib/models'), //detecta e desenha o quadrado ao redor do rosto
    faceapi.nets.faceLandmark68Net.loadFromUri('/lib/models'), //reconhece e desenha os traços do rosto
    faceapi.nets.faceRecognitionNet.loadFromUri('/lib/models'), //conhecimento do rosto - reconhecimento facial
    faceapi.nets.faceExpressionNet.loadFromUri('/lib/models'), //detecta expressão facial
    faceapi.nets.ageGenderNet.loadFromUri('/lib/models'), //detecta idade e gênero
    faceapi.nets.ssdMobilenetv1.loadFromUri('/lib/models') //detectar o rosto (debaixo dos panos)
]).then(startVideo)

cam.addEventListener('play', async() => {

    const canvas = faceapi.createCanvasFromMedia(cam)
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }

    var iniCam = new Date()
    //var horaIniCam = dataIni.getHours()          // 0-23
    var minIniCam  = iniCam.getMinutes()        // 0-59
    var secIniCam  = iniCam.getSeconds()        // 0-59
    var msecIniCam = iniCam.getMilliseconds()   // 0-999
    // o tempo ini vem aqui pois é quando chama a função pra iniciar a cam
    console.log('Min:Sec:mSec ini cam: %s:%s:%s', minIniCam, secIniCam, msecIniCam)

    const labels = await loadLabels()
    console.log(labels)

    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas)

    setInterval(async() => {

        var dataIni = new Date()
        //var horaIni = dataIni.getHours()          // 0-23
        var minIni  = dataIni.getMinutes()        // 0-59
        var secIni  = dataIni.getSeconds()        // 0-59
        var msecIni = dataIni.getMilliseconds()   // 0-999
        // o tempo ini vem aqui pois é quando chama a função pra iniciar a cam

        const detections = await faceapi
            .detectAllFaces(cam, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors()

        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        //console.log(detections) //qnd detecta uma face, ele retorna o x, y, altura, largura, pra montar o quadrado

        const faceMatcher = new faceapi.FaceMatcher(labels, 0.65)
        const results = resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor))

        var dataEnd = new Date()
        //var hora    = dataEnd.getHours()         
        var minEnd    = dataEnd.getMinutes()        
        var secEnd    = dataEnd.getSeconds()        
        var msecEnd   = dataEnd.getMilliseconds()   
        // o tempo end vem aqui pois é quando já tentou o faceMatcher

        var msSecIni = secIni/1000
        var totalIniMs = msSecIni + msecIni

        var msSecEnd = secEnd/1000
        var totalEndMs = msSecEnd + msecEnd       
          
        
        console.log('Min:Sec:mSec ini detecção: %s:%s:%s', minIni, secIni, msecIni)
        console.log(results[0].label)   
        console.log('min: s : ms reconhecimento: %s:%s:%s', minEnd, secEnd, msecEnd)
        //console.log('Tempo de execução: %s', totalEndMs - totalIniMs)

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height) //limpa o canvas (quadrado) limpando de x=y=0 até a posicao do width do quadrado 
        
        faceapi.draw.drawDetections(canvas, resizedDetections) //pedindo pra desenhar o canvas
                //1º param: onde quero que desenhe , 2º: fonte das infos.
        //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections) //pedindo pra desenhar os landmarks

        //faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
        
       
        results.forEach((result, index) => {
            const box = resizedDetections[index].detection.box
            const {label, distance} = result

            new faceapi.draw.DrawTextField([
                `${label} (${parseInt(distance*100, 10)})`
            ], box.bottomRight).draw(canvas)
        })

    }, 100)
})