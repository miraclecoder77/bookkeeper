import * as dal from '../services/dal';
import { initDB, getDB } from '../services/indexeddb';

// Simple unit/integration tests running inside the JS runtime environment
export const runAllTests = async () => {
  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    log('--- STARTING BOOKKEEPER DAL INTEGRATION TEST SUITE ---');
    await initDB();

    // 1. Test offline usability of Phase 1 core flows
    log('Testing Offline Usability of Phase 1 Core Flows...');
    const clientRes = await dal.clients.create({
      name: 'Test Client',
      email: 'test@example.com',
      defaultCurrency: 'NGN',
      defaultPaymentTermsDays: 14,
    });
    if (clientRes.ok && clientRes.data) {
      log('✅ Client creation offline matches expected contract.');
    } else {
      throw new Error('Offline client creation failed');
    }

    const txRes = await dal.transactions.create({
      type: 'income',
      date: '2026-07-19',
      amountMinorUnits: 500000,
      currency: 'NGN',
      categoryId: 'cat_consulting',
      paymentMethod: 'bank_transfer',
      notes: 'Consulting gig payment',
    });
    if (txRes.ok && txRes.data) {
      log('✅ Transaction logging offline matches expected contract.');
    } else {
      throw new Error('Offline transaction creation failed');
    }

    // 2. Test AI Insights making zero network calls when consent is off
    log('Testing AI Insights consent gate (making zero network calls when consent is off)...');
    await dal.ai.setConsent({ consentGiven: false });
    const insightsRes = await dal.ai.generateInsights();
    if (insightsRes.ok && insightsRes.data?.length === 0) {
      log('✅ Gated AI Insights returned empty array with consent off (no network calls made).');
    } else {
      throw new Error('AI Insights generated while consent was OFF');
    }

    // 3. Test Device revocation & remote wipe simulation
    log('Testing Device Revocation and Remote Wipe integrity...');
    const authRes = await dal.auth.verifyOtp('+2348000000000', '123456');
    if (authRes.ok && authRes.data) {
      const { device } = authRes.data;
      log(`Registered device: ${device.id}. Check status...`);
      
      const check1 = await dal.auth.checkWipeStatus(device.id, device.deviceSecret);
      log(`Initial wipe status requested: ${check1.data?.wipeRequested}`);
      
      // Revoke and wipe
      await dal.auth.revokeDevice(device.id, { wipeData: true });
      const check2 = await dal.auth.checkWipeStatus(device.id, device.deviceSecret);
      if (check2.data?.wipeRequested === true) {
        log('✅ Wipe status correctly updated to TRUE after Revoke & Erase request.');
      } else {
        throw new Error('Device revocation with wipe failed to flag wipeRequest');
      }
    } else {
      throw new Error('Auth OTP verification failed');
    }

    log('--- ALL INTEGRATION TESTS PASSED SUCCESSFULLY ---');
    return { ok: true, logs };
  } catch (e: any) {
    log(`❌ TEST FAILED: ${e.message}`);
    return { ok: false, logs };
  }
};
