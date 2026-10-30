import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Keyboard, View } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@proyecto/backend";
import type { Id } from "@proyecto/backend/dataModel";
import { useAppMode } from "../contexts/AppModeContext";
import { useAndroidBackHandler } from "../hooks/useAndroidBackHandler";
import { useDriverLiveTracking } from "../hooks/useDriverLiveTracking";
import { useDriverOfferLocation } from "../hooks/useDriverOfferLocation";
import { isActiveServiceStatus } from "../lib/serviceStatus";
import { ChecklistRecojoScreen } from "./ChecklistRecojoScreen";
import { LiveTripMapModal } from "../components/LiveTripMapModal";
import { DriverTabBar, type DriverTab } from "../components/driver/DriverTabBar";
import { DriverServiceHome } from "../components/driver/DriverServiceHome";
import { DriverRequestsTab } from "../components/driver/DriverRequestsTab";
import { DriverIncomeTab, type WalletFlow } from "../components/driver/DriverIncomeTab";
import { DriverChatsTab, type ChatsSection } from "../components/driver/DriverChatsTab";
import { DriverProfileTab } from "../components/driver/DriverProfileTab";
import { DriverRadiusSheet } from "../components/driver/DriverRadiusSheet";
import { DriverSafetyCenterSheet } from "../components/driver/DriverSafetyCenterSheet";
import { useAppTheme } from "../contexts/ThemeContext";

export function DriverDashboard() {
  const { userName } = useAppMode();
  const { colors } = useAppTheme();
  const me = useQuery(api.users.getMe);
  const driver = useQuery(api.drivers.getMyDriverProfile);
  const hasDriver = driver !== undefined && driver !== null;

  const [tab, setTab] = useState<DriverTab>("servicio");
  const [moneyDayKey, setMoneyDayKey] = useState<string | null>(null);
  const [walletFlow, setWalletFlow] = useState<WalletFlow>("balance");
  const [chatsSection, setChatsSection] = useState<ChatsSection>("soporte");
  const [profileSection, setProfileSection] = useState<"menu" | "datos">("menu");
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [checklistServiceId, setChecklistServiceId] =
    useState<Id<"services"> | null>(null);
  const [liveMapServiceId, setLiveMapServiceId] =
    useState<Id<"services"> | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const wallet = useQuery(api.driverWallets.getMine, hasDriver ? {} : "skip");
  const services = useQuery(api.services.listForDriver, hasDriver ? {} : "skip");
  const radius = useQuery(api.drivers.getMyOfferRadius, hasDriver ? {} : "skip");
  const myPendingOffers = useQuery(
    api.serviceOffers.listMinePending,
    hasDriver ? {} : "skip",
  );
  const notifications = useQuery(
    api.notifications.listMine,
    hasDriver ? { limit: 30 } : "skip",
  );
  const supportUnread = useQuery(api.support.getMyUnreadCount) ?? 0;

  const activeServices = (services ?? []).filter((service) =>
    isActiveServiceStatus(service.status),
  );
  const hasActiveService = activeServices.length > 0;
  const isAvailable = driver?.status === "available";

  const locationEnabled =
    isAvailable && !hasActiveService && (tab === "servicio" || tab === "lista");
  const {
    coords: offerCoords,
    error: offerLocationError,
    loading: offerLocationLoading,
    refresh: refreshOfferLocation,
  } = useDriverOfferLocation(locationEnabled);

  const openOffersPayload = useQuery(
    api.services.listOpenForOffers,
    !hasDriver || !isAvailable || hasActiveService
      ? "skip"
      : offerCoords !== null
        ? { driverLat: offerCoords.lat, driverLng: offerCoords.lng }
        : {},
  );
  const openServices = openOffersPayload?.services ?? [];
  const radiusKm = radius?.radiusKm ?? openOffersPayload?.maxDistanceKm ?? 10;

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const goToTab = useCallback((next: DriverTab) => {
    setTab(next);
    if (next !== "ingresos") {
      setWalletFlow("balance");
      setMoneyDayKey(null);
    }
    if (next !== "perfil") {
      setProfileSection("menu");
    }
  }, []);

  const goToTopUp = useCallback(() => {
    setTab("ingresos");
    setMoneyDayKey(null);
    setWalletFlow("topup");
  }, []);

  const handleAndroidBack = useCallback(() => {
    if (liveMapServiceId !== null) {
      setLiveMapServiceId(null);
      return true;
    }
    if (checklistServiceId !== null) {
      setChecklistServiceId(null);
      return true;
    }
    if (tab === "ingresos" && walletFlow === "topup") {
      setWalletFlow("balance");
      return true;
    }
    if (tab === "ingresos" && moneyDayKey !== null) {
      setMoneyDayKey(null);
      return true;
    }
    if (tab === "perfil" && profileSection === "datos") {
      setProfileSection("menu");
      return true;
    }
    if (tab !== "servicio") {
      goToTab("servicio");
      return true;
    }
    return false;
  }, [
    liveMapServiceId,
    checklistServiceId,
    tab,
    walletFlow,
    moneyDayKey,
    profileSection,
    goToTab,
  ]);

  useAndroidBackHandler(handleAndroidBack);
  useDriverLiveTracking(services);

  if (driver === undefined) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.base }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (driver === null) {
    return null;
  }

  if (checklistServiceId !== null) {
    return (
      <ChecklistRecojoScreen
        serviceId={checklistServiceId}
        onBack={() => setChecklistServiceId(null)}
      />
    );
  }

  const tripCredits = wallet?.tripCredits ?? 0;
  const unreadNotifications = (notifications ?? []).filter(
    (notification) => notification.readAt === undefined,
  ).length;
  const myOfferByService: Record<string, number> = Object.fromEntries(
    (myPendingOffers ?? []).map((offer) => [offer.serviceId, offer.offeredPrice]),
  );
  const fallbackCenter =
    activeServices[0] !== undefined
      ? { lat: activeServices[0].origin.lat, lng: activeServices[0].origin.lng }
      : (offerCoords ?? undefined);

  let content;
  switch (tab) {
    case "servicio":
      content = (
        <DriverServiceHome
          status={driver.status}
          tripCredits={tripCredits}
          radiusKm={radiusKm}
          nearbyCount={openOffersPayload === undefined ? null : openServices.length}
          coords={offerCoords}
          activeServices={activeServices}
          onOpenChecklist={setChecklistServiceId}
          onOpenLiveMap={setLiveMapServiceId}
          onOpenRadius={() => setRadiusOpen(true)}
          onOpenSafety={() => setSafetyOpen(true)}
          onGoToList={() => goToTab("lista")}
          onGoToEarnings={() => goToTab("ingresos")}
        />
      );
      break;
    case "lista":
      content = (
        <DriverRequestsTab
          isAvailable={isAvailable && !hasActiveService}
          openServices={openServices}
          loaded={openOffersPayload !== undefined}
          locationLoading={offerLocationLoading}
          locationError={offerLocationError}
          onRefreshLocation={() => void refreshOfferLocation()}
          myOfferByService={myOfferByService}
          tripCredits={tripCredits}
          onGoToTopUp={goToTopUp}
          onGoToService={() => goToTab("servicio")}
        />
      );
      break;
    case "ingresos":
      content = (
        <DriverIncomeTab
          walletFlow={walletFlow}
          onWalletFlowChange={setWalletFlow}
          dayKey={moneyDayKey}
          onDayChange={setMoneyDayKey}
        />
      );
      break;
    case "chats":
      content = (
        <DriverChatsTab
          section={chatsSection}
          onSectionChange={setChatsSection}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
        />
      );
      break;
    case "perfil":
      content = (
        <DriverProfileTab
          driver={driver}
          userName={userName}
          avatarUrl={me?.selfieUrl}
          section={profileSection}
          onSectionChange={setProfileSection}
        />
      );
      break;
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.base }}>
      <View className="flex-1">{content}</View>

      {!keyboardVisible && (
        <DriverTabBar
          active={tab}
          onChange={goToTab}
          badges={{
            lista: isAvailable && !hasActiveService ? openServices.length : 0,
            chats: unreadNotifications + supportUnread,
          }}
        />
      )}

      <DriverRadiusSheet visible={radiusOpen} onClose={() => setRadiusOpen(false)} />
      <DriverSafetyCenterSheet
        visible={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        activeService={activeServices[0]}
        fallbackCenter={fallbackCenter}
        onShareTrip={() => {
          if (activeServices[0] !== undefined) {
            setLiveMapServiceId(activeServices[0]._id);
          }
        }}
        onOpenSupport={() => {
          setChatsSection("soporte");
          goToTab("chats");
        }}
      />
      <LiveTripMapModal
        visible={liveMapServiceId !== null}
        serviceId={liveMapServiceId ?? undefined}
        onClose={() => setLiveMapServiceId(null)}
        title="Compartir viaje"
      />
    </View>
  );
}
