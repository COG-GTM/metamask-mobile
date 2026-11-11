package io.metamask.nativesdk;

import android.os.Binder;
import android.os.Bundle;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

/**
 * Callback a native Android dapp registers with {@link MessageService} to receive wallet messages.
 * The descriptor and transaction codes must stay wire compatible with the AIDL used by the SDK.
 */
public interface IMessegeServiceCallback extends IInterface {
  void onMessageReceived(Bundle response) throws RemoteException;

  abstract class Stub extends Binder implements IMessegeServiceCallback {
    private static final String DESCRIPTOR = "io.metamask.nativesdk.IMessegeServiceCallback";
    static final int TRANSACTION_onMessageReceived = IBinder.FIRST_CALL_TRANSACTION;

    public Stub() {
      attachInterface(this, DESCRIPTOR);
    }

    public static IMessegeServiceCallback asInterface(IBinder obj) {
      if (obj == null) {
        return null;
      }
      IInterface iin = obj.queryLocalInterface(DESCRIPTOR);
      if (iin instanceof IMessegeServiceCallback) {
        return (IMessegeServiceCallback) iin;
      }
      return new Proxy(obj);
    }

    @Override
    public IBinder asBinder() {
      return this;
    }

    @Override
    public boolean onTransact(int code, Parcel data, Parcel reply, int flags)
        throws RemoteException {
      switch (code) {
        case INTERFACE_TRANSACTION:
          reply.writeString(DESCRIPTOR);
          return true;
        case TRANSACTION_onMessageReceived: {
          data.enforceInterface(DESCRIPTOR);
          Bundle response = data.readInt() != 0 ? Bundle.CREATOR.createFromParcel(data) : null;
          onMessageReceived(response);
          reply.writeNoException();
          if (response != null) {
            reply.writeInt(1);
            response.writeToParcel(reply, android.os.Parcelable.PARCELABLE_WRITE_RETURN_VALUE);
          } else {
            reply.writeInt(0);
          }
          return true;
        }
        default:
          return super.onTransact(code, data, reply, flags);
      }
    }

    private static class Proxy implements IMessegeServiceCallback {
      private final IBinder remote;

      Proxy(IBinder remote) {
        this.remote = remote;
      }

      @Override
      public IBinder asBinder() {
        return remote;
      }

      @Override
      public void onMessageReceived(Bundle response) throws RemoteException {
        Parcel data = Parcel.obtain();
        Parcel reply = Parcel.obtain();
        try {
          data.writeInterfaceToken(DESCRIPTOR);
          if (response != null) {
            data.writeInt(1);
            response.writeToParcel(data, 0);
          } else {
            data.writeInt(0);
          }
          remote.transact(TRANSACTION_onMessageReceived, data, reply, 0);
          reply.readException();
          if (reply.readInt() != 0 && response != null) {
            response.readFromParcel(reply);
          }
        } finally {
          reply.recycle();
          data.recycle();
        }
      }
    }
  }
}
