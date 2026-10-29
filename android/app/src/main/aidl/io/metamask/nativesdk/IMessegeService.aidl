package io.metamask.nativesdk;

import android.os.Bundle;
import io.metamask.nativesdk.IMessegeServiceCallback;

interface IMessegeService {
    void registerCallback(IMessegeServiceCallback callback);
    void sendMessage(in Bundle message);
}
