import { useCallback, useEffect, useRef, useState } from "react";
import { IInstrumentsButtons } from "../../../../../shared/Types/device.type";
import RFB from "../../../../../shared/noVNC/core/rfb";
import { getPasswordVNC, getUrlVnc } from "../../../../../utils/noVNC.utils";
import { useLatest } from "../../../../../hooks/useLatest";

export const useNoVns = (device: IInstrumentsButtons) => {
  enum Events {
    connect,
    disconnect,
    credentialsrequired,
  }
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const screen = useRef<HTMLDivElement | null>(null);
  const rfb = useRef<RFB | null>(null);
  const device_url = useRef<string | null>(null);

  const setRfb = (_rfb: RFB | null) => {
    rfb.current = _rfb;
  };

  const getRfb = () => {
    return rfb.current;
  };

  const onConnect = () => {
    console.log("CONNECTED");
    setLoading(false);
    setConnected(true);
    console.log(screen);
  };

  const onDisconnect = () => {
    console.log("DISCONNECTED");
    setLoading(false);
    setConnected(false);
  };

  const onCredentialsrequired = () => {
    const session = getRfb();
    if (session) {
      session.sendCredentials({ password: getPasswordVNC() });
    }
  };

  const events = {
    connect: onConnect,
    disconnect: onDisconnect,
    credentialsrequired: onCredentialsrequired,
  };

  const connect = useCallback(() => {
    // if (!device_url) { throw 'URL is required' }
    // const res_url = `ws://${constants.server_ip}:6080/websockify?token=SA1`
    const _rfb = new RFB(screen.current, getUrlVnc(device.id));
    _rfb.clipViewport = true;
    _rfb.scaleViewport = true;
    _rfb.qualityLevel = 9;
    _rfb.viewOnly = false;
    _rfb.compressionLevel = 0;
    _rfb.background = "#000";
    // _rfb.qualityLevel = 9
    setRfb(_rfb);

    const addEventListeners = (_rfb: RFB) => {
      (Object.keys(events) as (keyof typeof Events)[]).forEach((event) => {
        _rfb.addEventListener(event, events[event]);
      });
    };

    addEventListeners(_rfb);

    setLoading(true);
  }, []);

  const disconnect = useCallback(() => {
    const session = getRfb();
    if (!session) {
      console.error("There is no session to disconnect from");
      return;
    }

    const removeEventListeners = (_rfb: RFB) => {
      (Object.keys(events) as (keyof typeof Events)[]).forEach((event) => {
        _rfb.removeEventListener(event, events[event]);
      });
    };

    removeEventListeners(session);

    session.disconnect();
    setRfb(null);
    setConnected(false);
  }, []);

  return { screen, disconnect, connect, loading, connected };
};
