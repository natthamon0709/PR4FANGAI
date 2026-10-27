import { NextRequest, NextResponse } from 'next/server';
import { generateAudioReply } from '@/lib/tts-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    if (searchParams.get('debug') === '1') {
      const crypto = await import('crypto');
      const { generateSecMsGecV2, EDGE_TTS_TRUSTED_CLIENT_TOKEN, EDGE_TTS_SEC_MS_GEC_VERSION } = await import('@/lib/edge-drm');
      const wsModule = await import('ws');
      const WsClass: any = wsModule.default || wsModule;

      const connId = crypto.randomUUID().replace(/-/g, '');
      const reqId = crypto.randomUUID().replace(/-/g, '');
      const gec = generateSecMsGecV2();
      const muid = crypto.randomBytes(16).toString('hex').toUpperCase();

      const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${EDGE_TTS_TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${EDGE_TTS_SEC_MS_GEC_VERSION}&ConnectionId=${connId}`;

      const logs: string[] = [];
      logs.push(`Connecting to ${wsUrl.slice(0, 80)}...`);

      const probeResult = await new Promise<any>((resolve) => {
        try {
          const ws = new WsClass(wsUrl, {
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
              'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
              'Cookie': `muid=${muid};`
            }
          });

          const timer = setTimeout(() => {
            logs.push('Timeout after 4000ms');
            try { ws.close(); } catch {}
            resolve({ status: 'timeout', logs });
          }, 4000);

          ws.on('open', () => {
            logs.push('Open event received');
            const configMsg =
              'Content-Type:application/json; charset=utf-8\r\n' +
              'Path:speech.config\r\n\r\n' +
              JSON.stringify({
                context: {
                  synthesis: {
                    audio: {
                      metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                      outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
                    }
                  }
                }
              });
            ws.send(configMsg);

            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='th-TH'><voice name='th-TH-NiwatNeural'>ทดสอบครับ</voice></speak>`;
            const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
            ws.send(ssmlMsg);
          });

          let chunkCount = 0;
          let bytesCount = 0;

          ws.on('message', (data: any, isBinary: boolean) => {
            if (isBinary) {
              chunkCount++;
              bytesCount += data.length;
            } else {
              const str = data.toString();
              logs.push(`Msg: ${str.slice(0, 60)}`);
              if (str.includes('Path:turn.end')) {
                clearTimeout(timer);
                logs.push(`Turn end! chunks=${chunkCount}, bytes=${bytesCount}`);
                try { ws.close(); } catch {}
                resolve({ status: 'success', chunkCount, bytesCount, logs });
              }
            }
          });

          ws.on('error', (err: any) => {
            clearTimeout(timer);
            logs.push(`Error event: ${err?.message || err}`);
            resolve({ status: 'error', error: err?.message || String(err), logs });
          });

          ws.on('close', (code: any, reason: any) => {
            clearTimeout(timer);
            logs.push(`Close event: code=${code}, reason=${reason?.toString()}`);
            resolve({ status: 'closed', code, reason: reason?.toString(), logs });
          });
        } catch (e: any) {
          logs.push(`Exception: ${e.message}`);
          resolve({ status: 'exception', error: e.message, logs });
        }
      });

      return NextResponse.json({
        probeResult,
        nodeVersion: process.version,
        envVercel: Boolean(process.env.VERCEL)
      });
    }

    const genderParam = searchParams.get('gender') || 'female';
    const voiceGender: 'female' | 'male' = genderParam === 'male' ? 'male' : 'female';

    const welcomeText = voiceGender === 'female'
      ? 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางค่ะ หนูคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยค่ะ แตะปุ่มไมโครโฟนเพื่อพูด หรือพิมพ์ข้อความคำถามได้เลยนะคะ'
      : 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางครับ ผมคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยครับ แตะปุ่มไมโครโฟนเพื่อพูด หรือพิมพ์ข้อความคำถามได้เลยครับ';

    const publicBaseUrl = req.nextUrl.origin;

    const audioRes = await generateAudioReply({
      text: welcomeText,
      voiceGender,
      speed: 1.0,
      dialect: 'central',
      publicBaseUrl
    });

    if (audioRes.success && audioRes.audioUrl) {
      return NextResponse.json({
        success: true,
        audioUrl: audioRes.audioUrl,
        durationMs: audioRes.durationMs,
        gender: voiceGender
      });
    }

    return NextResponse.json({
      success: false,
      error: audioRes.error || 'ไม่สามารถสังเคราะห์เสียงต้อนรับได้'
    }, { status: 500 });
  } catch (err: any) {
    console.error('Welcome audio error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal error'
    }, { status: 500 });
  }
}
