let model, webcam, ctx1, ctx2, timer;
let tempoRodada = 3000;
let comandoAtual = "";
let posP1 = "", posP2 = "";

function falar(texto) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = 1.2;
    window.speechSynthesis.speak(fala);
  }
}

async function iniciar() {
  const url = document.getElementById("url").value;
  model = await tmPose.load(url + "model.json", url + "metadata.json");

  webcam = new tmPose.Webcam(800, 600, true);
  await webcam.setup();
  await webcam.play();

  const c1 = document.getElementById("c1");
  const c2 = document.getElementById("c2");
  c1.width = 400; c1.height = 600;
  c2.width = 400; c2.height = 600;
  ctx1 = c1.getContext("2d");
  ctx2 = c2.getContext("2d");

  document.getElementById("setup").style.display = "none";
  document.getElementById("jogo").style.display = "block";

  loop();
  contagemInicial();
}

async function loop() {
  webcam.update();

  ctx1.drawImage(webcam.canvas, 0, 0, 400, 600, 0, 0, 400, 600);
  ctx2.drawImage(webcam.canvas, 400, 0, 400, 600, 0, 0, 400, 600);

  const res1 = await model.estimatePose(document.getElementById("c1"));
  const res2 = await model.estimatePose(document.getElementById("c2"));

  if (res1.pose) {
    tmPose.drawKeypoints(res1.pose.keypoints, 0.6, ctx1);
    tmPose.drawSkeleton(res1.pose.keypoints, 0.6, ctx1);
  }
  if (res2.pose) {
    tmPose.drawKeypoints(res2.pose.keypoints, 0.6, ctx2);
    tmPose.drawSkeleton(res2.pose.keypoints, 0.6, ctx2);
  }

  const p1 = await model.predict(res1.posenetOutput);
  const p2 = await model.predict(res2.posenetOutput);

  if (p1 && p1.length > 0) {
    posP1 = p1.reduce((a, b) => (a.probability > b.probability ? a : b)).className;
    document.getElementById("st1").innerText = posP1;
  }
  if (p2 && p2.length > 0) {
    posP2 = p2.reduce((a, b) => (a.probability > b.probability ? a : b)).className;
    document.getElementById("st2").innerText = posP2;
  }

  requestAnimationFrame(loop);
}

function contagemInicial() {
  document.getElementById("resultado").innerText = "";
  document.getElementById("comando").innerText = "PREPAREM-SE!";
  falar("Preparem-se!");

  let contagem = 5;
  document.getElementById("tempo").innerText = contagem + "s";

  clearInterval(timer);
  timer = setInterval(() => {
    contagem--;
    if (contagem > 0) {
      document.getElementById("tempo").innerText = contagem + "s";
    } else {
      clearInterval(timer);
      novaRodada();
    }
  }, 1000);
}

function novaRodada() {
  document.getElementById("resultado").innerText = "";
  
  const opcoes = ["Vivo", "Morto"];
  comandoAtual = opcoes[Math.floor(Math.random() * opcoes.length)];
  document.getElementById("comando").innerText = comandoAtual.toUpperCase();
  falar(comandoAtual);

  let tempoRestante = tempoRodada;
  document.getElementById("tempo").innerText = (tempoRestante / 1000).toFixed(1) + "s";

  clearInterval(timer);
  timer = setInterval(() => {
    tempoRestante -= 100;
    document.getElementById("tempo").innerText = (tempoRestante / 1000).toFixed(1) + "s";

    if (tempoRestante <= 0) {
      clearInterval(timer);
      verificar();
    }
  }, 100);
}

function verificar() {
  const ok1 = posP1.toLowerCase() === comandoAtual.toLowerCase();
  const ok2 = posP2.toLowerCase() === comandoAtual.toLowerCase();

  if (ok1 && ok2) {
    document.getElementById("resultado").innerText = "⚡ AMBOS ACERTARAM! ACELERANDO... ⚡";
    tempoRodada = Math.max(1500, tempoRodada * 0.8);
    setTimeout(novaRodada, 1800);
  } else if (ok1 && !ok2) {
    document.getElementById("resultado").innerText = "🏆 JOGADOR 1 VENCEU! 🎉";
    falar("Jogador 1 venceu!");
    fimJogo();
  } else if (!ok1 && ok2) {
    document.getElementById("resultado").innerText = "🏆 JOGADOR 2 VENCEU! 🎉";
    falar("Jogador 2 venceu!");
    fimJogo();
  } else {
    document.getElementById("resultado").innerText = "❌ OS DOIS ERRAMAM! ❌";
    falar("Os dois erraram!");
    fimJogo();
  }
}

function fimJogo() {
  document.getElementById("btn-reiniciar").style.display = "block";
}

function reiniciar() {
  tempoRodada = 3000;
  document.getElementById("btn-reiniciar").style.display = "none";
  contagemInicial();
}